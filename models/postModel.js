const postsCollection = require('../server').db().collection('posts');
const followsCollection = require('../server').db().collection('follows');
const ObjectID = require('mongodb').ObjectID;
const User = require('./userModel');
const sanitizeHTML = require('sanitize-html');

let Post = function(data, userId, postId) {
  this.data = data;
  this.errors = [];
  this.userId = userId;
  this.postId = postId;
};

Post.prototype.cleanUp = function() {
  if (typeof(this.data.title) !='string') {this.data.title=''};
  if (typeof(this.data.body) !='string') {this.data.body=''};

  // Remove any other unneccessary properties
  this.data = {
    title: sanitizeHTML(this.data.title.trim(), 
    {allowTags: [], allowedAttributes: {}}),
    body: sanitizeHTML(this.data.body.trim(), 
    {allowTags: [], allowedAttributes: {}}),
    createdDate: new Date(),
    author: ObjectID(this.userId),
    slug: this.data.title.toString().toLowerCase()
          .replace(/\s+/g, '-')        // Replace spaces with -
          .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
          .replace(/\-\-+/g, '-')      // Replace multiple - with single -
  };
};

Post.prototype.validate = function() {
  if (this.data.title == '') {this.errors.push("You must provide a title")}
  if (this.data.body == '') {this.errors.push("You must provide text in the Body Content field")}
};

Post.prototype.create = function() {
  return new Promise((resolve, reject) => {
    this.cleanUp();
    this.validate();
    if (!this.errors.length) {
      // Save post into database
      postsCollection.insertOne(this.data)
        .then((info) => {
          resolve(info.ops[0].slug);
        }).catch(() => {
          this.errors.push("Please try again later");
          reject(this.errors);
        });
      
    } else {
      reject(this.errors);
    };
  });
};

Post.prototype.update = function() {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findBySlug(this.postId, this.userId);
      if (post.isVisitorOwner) {
        let status = await this.actuallyUpdate();
        resolve(status);
      } else {
        reject();
      };
    } catch {
      reject();
    };
  });
};

Post.prototype.actuallyUpdate = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    this.validate();
    if (!this.errors.length) {
      await postsCollection.findOneAndUpdate({slug: this.postId }, 
        {$set: {title: this.data.title,
                body: this.data.body}
        });
        resolve('success');
    } else {
      resolve('failure');
    };
  });
};

Post.reusablePostQuery = function(uniqueOperations, visitorId) {
  return new Promise(async function(resolve, reject) {
    let aggOperations = uniqueOperations.concat([
      {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
      {$project: {
        title: 1,
        body: 1,
        slug: 1,
        createdDate: 1,
        authorId: "$author",
        author: {$arrayElemAt: ['$authorDocument', 0]}
      }}
    ]);
    let posts = await postsCollection.aggregate(aggOperations).toArray();

    // clean up author property in each post object
    posts = posts.map(function(post) {
      post.isVisitorOwner = post.authorId.equals(visitorId);
      post.authorId = undefined;
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      };
      return post;
    });
    resolve(posts);
  });
};

Post.findBySlug = function(title, visitorId) {
  return new Promise(async function(resolve, reject) {
    if (typeof(title) != 'string') {
      reject()
      return
    };
    let posts = await Post.reusablePostQuery([
      {$match: {slug: title}}
    ], visitorId)
    if (posts.length) {
      console.log(posts[0]);
      resolve(posts[0]);
    } else {
      reject();
    };
  });
};

Post.findByAuthorId = function(authorId) {
  return Post.reusablePostQuery([
    {$match: {author: authorId}},
    {$sort: {createdDate: -1}}
  ]);
};

Post.delete = function(postIdToDelete, currentUserId) {
  return new Promise(async(resolve, reject) => {
    try {
      let post = await Post.findBySlug(postIdToDelete, currentUserId);
      if (post.isVisitorOwner) {
        await postsCollection.deleteOne({slug: postIdToDelete});
        resolve();
      } else {
        reject();
      };
    } catch {
      reject();
    };
  });
};

Post.search = function(searchTerm) {
  return new Promise(async (resolve, reject) => {
    if (typeof(searchTerm) == 'string') {
      let posts = await Post.reusablePostQuery([
        {$match: {$text: {$search: searchTerm}}},
        {$sort: {score: {$meta: 'textScore'}}}
      ]);
      resolve(posts);
    } else {
      reject();
    };
  });
};

Post.countPostsByAuthor = function(id) {
  return new Promise(async (resolve, reject) => {
    let postCount = await postsCollection.countDocuments({author: id});
    resolve(postCount);
  });
};

Post.getFeed = async function (id) {
  // Create an array of the user IDs that the current user follows
  let followedUsers = await followsCollection.find({userId: new ObjectID(id)}).toArray();
  followedUsers = followedUsers.map(function(followDoc) {
    return followDoc.followedId;
  });

  // Look for the posts where the author is in the above array of followed posts
  return Post.reusablePostQuery([
    {$match: {author: {$in: followedUsers}}},
    {$sort: {createdDate: -1}}
  ]);
};

Post.getAllPosts = async function() {
  let posts = await postsCollection.find()
  return Post.reusablePostQuery([
    {$sort: {createdDate: -1}}
  ]);
};

module.exports = Post