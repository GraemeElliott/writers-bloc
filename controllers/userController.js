const User = require('../models/userModel');
const Post = require('../models/postModel');
const Follow = require('../models/followModel');

exports.sharedProfileData = async function(req, res, next) {
  let isVisitorsProfile = false;
  let isFollowing = false;
  if (req.session.user) {
    isVisitorsProfile = req.profileUser._id.equals(req.session.user._id);
    isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId);
  };

  req.isVisitorsProfile = isVisitorsProfile;
  req.isFollowing = isFollowing;

  // Retrieve post, follower and following counts
  let postCountPromise = Post.countPostsByAuthor(req.profileUser._id);
  let followerCountPromise = Follow.countFollowersById(req.profileUser._id);
  let followingCountPromise = Follow.countFollowingById(req.profileUser._id);

  let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise]);

  req.postCount = postCount;
  req.followerCount = followerCount;
  req.followingCount = followingCount;
  
  next();
};

exports.loggedIn = function(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.flash('errors', "You must be logged in to perform that action");
    req.session.save(function() {
      res.redirect('/');
    });
  };
};

exports.login = function (req, res) {
  let user = new User(req.body)
  user.login()
    .then(function(result) {
      req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id};
      req.session.save(function() {
        res.redirect('/');
      });
    })
    .catch(function(error) {
      req.flash('errors', error);
      req.session.save(function() {
        res.redirect('/');
      });
    });
};

exports.logout = function (req, res) {
  req.session.destroy(function() {
    res.redirect('/');
  });
};

exports.register = function (req, res) {
  let user = new User(req.body);
  user.register().then(() => {
    req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id};
    req.session.save(function() {
      res.redirect('/')
    });
  }).catch((regErrors) => {
    regErrors.forEach(function(error) {
      req.flash('regErrors', error)
    });
    req.session.save(function() {
      res.redirect('/')
    });
  });
};

exports.home = async function (req, res) {
  // Fetch feed of posts for current user
  if (req.session.user) {
    let posts = await Post.getFeed(req.session.user._id);
    res.render('home-dashboard', {posts: posts});
  } else {
    res.render('home-guest', {errors: req.flash('errors'), regErrors: req.flash('regErrors')});
  };
};

exports.allPosts = async function (req, res) {
  // Fetch all posts by all users
  if (req.session.user) {
    let posts = await Post.getAllPosts();

    res.render('all-posts', {posts: posts});
  } else {
    res.render('home-guest', {errors: req.flash('errors'), "You must be logged in to view this page": req.flash("You must be logged in to view this page")});
  };
};

exports.ifUserExists = function(req, res, next) {
  User.findByUsername(req.params.username)
  .then(function(userDocument) {
    req.profileUser = userDocument
    next()
  }).catch(function() {
    res.render('404')
  })
};

exports.profilePostsPage = function(req, res) {
  // Ask Post Model for posts by a certain author ID.
  Post.findByAuthorId(req.profileUser._id).then(function(posts) {
    res.render('profile', {
      title: `Profile Page: ${req.profileUser.username}`,
      currentPage: 'posts',
      posts: posts,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
    });
  }).catch(function() {
    res.render('404');
  });
};

exports.followersPage = async function (req, res) {
  try {
    let followers = await Follow.getFollowersById(req.profileUser._id)
    res.render('profile-followers', {
    currentPage: 'followers',
    followers: followers,
    profileUsername: req.profileUser.username,
    profileAvatar: req.profileUser.avatar,
    isFollowing: req.isFollowing,
    isVisitorsProfile: req.isVisitorsProfile,
    counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
  });

  } catch {
    res.render('404');
  };
};

exports.followingPage = async function (req, res) {
  try {
    let following = await Follow.getFollowingById(req.profileUser._id);
    res.render('profile-following', {
    currentPage: 'following',
    following: following,
    profileUsername: req.profileUser.username,
    profileAvatar: req.profileUser.avatar,
    isFollowing: req.isFollowing,
    isVisitorsProfile: req.isVisitorsProfile,
    counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
  });

  } catch {
    res.render('404');
  };
};

exports.doesUsernameExist = function(req, res) {
  User.findByUsername(req.body.username).then(function() {
    res.json(true);
  }).catch(function() {
    res.json(false);
  });
};

exports.doesEmailExist = async function(req, res) {
  let emailBool = await User.doesEmailExist(req.body.email);
  res.json(emailBool);
};