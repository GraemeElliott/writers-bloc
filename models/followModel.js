const usersCollection = require('../server').db().collection('users');
const followsCollection = require('../server').db().collection('follows');
const ObjectID = require('mongodb').ObjectID;
const User = require('./userModel');

let Follow = function(followedUsernane, userId) {
  this.followedUsernane = followedUsernane;
  this.userId = userId;
  this.errors = [];
};

Follow.prototype.cleanUp = function() {
  if(typeof(this.followedUsernane) != 'string') {this.followedUsernane = ''};
};

Follow.prototype.validate = async function(action) {
  // Followed Username must exist in database
  let followedAccount = await usersCollection.findOne({username: this.followedUsernane})
  if (followedAccount) {
    this.followedId = followedAccount._id;
  } else {
    this.errors.push("You cannot follow a non-existant user")
  };
  let doesFollowAlreadyExist = await followsCollection.findOne({followedId: this.followedId, userId: new ObjectID(this.userId)});

  if(action == 'create') {
    if (doesFollowAlreadyExist) {this.errors.push('You are already following this user')};
  };

  if(action == 'delete') {
    if (!doesFollowAlreadyExist) {this.errors.push('You cannot stop following a user you do not already follow')};
  };

  // Should not be able to follow yourself

  if(this.followedId.equals(this.userId)) {this.errors.push('You cannot follow yourself')};
    
};

Follow.prototype.create = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate('create');
    if (!this.errors.length) {
      await followsCollection.insertOne({followedId: this.followedId, userId: new ObjectID(this.userId)});
      resolve();
    } else {
      reject(this.errors);
    };
  });
};

Follow.prototype.delete = function() {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate("delete")
    if (!this.errors.length) {
      await followsCollection.deleteOne({followedId: this.followedId, userId: new ObjectID(this.userId)})
      resolve()
    } else {
      reject(this.errors)
    }
  })
}

Follow.isVisitorFollowing = async function(followedId, visitorId) {
  let followDoc = await followsCollection.findOne({followedId: followedId, userId: new ObjectID(visitorId)})
  if (followDoc) {
    return true
  } else {
    return false
  }
};

Follow.getFollowersById = function(id) {
  return new Promise(async (resolve, reject) => {
    try {
      let followers = await followsCollection.aggregate([
        {$match: {followedId: id}},
        {$lookup: {from: 'users', localField: 'userId', foreignField: '_id', as: 'userDoc'}},
        {$project: {
          username: {$arrayElemAt: ['$userDoc.username', 0]},
          email: {$arrayElemAt: ['$userDoc.email', 0]}
        }}
      ]).toArray();
      followers = followers.map(function(follower) {
        let user = new User(follower, true);
        return {username: follower.username, avatar: user.avatar};
      });
      resolve(followers);
    } catch {
      reject();
    };
  });
};

Follow.getFollowingById = function(id) {
  return new Promise(async (resolve, reject) => {
    try {
      let followers = await followsCollection.aggregate([
        {$match: {userId: id}},
        {$lookup: {from: 'users', localField: 'followedId', foreignField: '_id', as: 'userDoc'}},
        {$project: {
          username: {$arrayElemAt: ['$userDoc.username', 0]},
          email: {$arrayElemAt: ['$userDoc.email', 0]}
        }}
      ]).toArray();
      followers = followers.map(function(follower) {
        let user = new User(follower, true);
        return {username: follower.username, avatar: user.avatar};
      });
      resolve(followers);
    } catch {
      reject();
    };
  });
};

Follow.countFollowersById = function(id) {
  return new Promise(async (resolve, reject) => {
    let followerCount = await followsCollection.countDocuments({followedId: id});
    resolve(followerCount);
  });
};

Follow.countFollowingById = function(id) {
  return new Promise(async (resolve, reject) => {
    let followingCount = await followsCollection.countDocuments({userId: id});
    resolve(followingCount);
  });
};

module.exports = Follow;