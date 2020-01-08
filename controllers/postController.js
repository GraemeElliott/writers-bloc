const Post = require('../models/postModel');

exports.viewCreatePostForm = function(req, res) {
  res.render('create-post')
};

exports.createPost = function(req, res) {
  let post = new Post (req.body, req.session.user._id);
  post.create().then(function(newSlug) {
    req.flash('success', 'New post successfully created');
    req.session.save(() => res.redirect(`/post/${newSlug}/`));
  }).catch(function(errors) {
    errors.forEach(error => req.flash('errors', error));
    req.session.save(() => req.redirect('/create-post'));
  });
};

exports.viewPost = async function(req, res) {
  try {
    let post = await Post.findBySlug(req.params.slug, req.visitorId);
    res.render('post', {post: post, title: post.title});
  } catch {
    res.render('404');
  };
};

exports.editPostPage = async function(req, res) {
  try {
    let post = await Post.findBySlug(req.params.slug, req.visitorId);
    if (post.isVisitorOwner) {
      res.render('edit-post', {post: post});
    } else {
      req.flash('errors', "You do not have permission to perform that action");
      req.session.save(() => res.redirect(`/post/${req.params.slug}/`));
    }
  } catch {
    res.render('404');
  };
};

exports.editPost = function (req, res) {
  let post = new Post(req.body, req.visitorId, req.params.slug)
  post.update().then((status) => {
    // The post as successfully updated or there were validation errors
    if (status == 'success') {
      // Post was updated in db
      req.flash('success', 'Post successfully updated');
      req.session.save(function() {
        res.redirect(`/post/${req.params.slug}/`)
      });
    } else {
      // Post had validation errors
      post.errors.forEach(function(error) {
        req.flash('errors', error)
      });
      req.session.save(function() {
        res.redirect(`/post/${req.params.slug}/edit`)
      });
    };
  }).catch(() => {
    // A post with slug doesn't exist or the visitor is not the owner
    req.flash('errors', 'You do not have permission to perform that action');
    req.session.save(function() {
      res.redirect(`/post/${req.params.slug}/`);
    });
  });
};

exports.deletePost = function(req, res) {
  Post.delete(req.params.slug, req.visitorId).then(() => {
    req.flash('success', 'Post successfully deleted')
    req.session.save(() => res.redirect(`/profile/${req.session.user.username}`));
  }).catch(() => {
    req.flash('errors', 'You do not have permission to perform that action');
    req.session.save(() => res.redirect('/'));
  });
};

exports.search = function(req, res) {
  Post.search(req.body.searchTerm).then(posts => {
    res.json(posts);
  }).catch(() => {
    res.json([]);
  });
};