const express = require('express'),
      router = express.Router(),
      userController = require('./controllers/userController'),
      postController = require('./controllers/postController'),
      followController = require('./controllers/followController');

// User routers
router.get('/', userController.home);
router.get('/all-posts', userController.allPosts);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.post('/doesusernameexist', userController.doesUsernameExist);
router.post('/doesemailexist', userController.doesEmailExist);

// Profile related routes
router.get('/profile/:username', userController.ifUserExists, userController.sharedProfileData, userController.profilePostsPage);
router.get('/profile/:username/followers', userController.ifUserExists, userController.sharedProfileData, userController.followersPage);
router.get('/profile/:username/following', userController.ifUserExists, userController.sharedProfileData, userController.followingPage);


// Post routes
router.get('/create-post', userController.loggedIn, postController.viewCreatePostForm);
router.post('/create-post', userController.loggedIn, postController.createPost);
router.get('/post/:slug', postController.viewPost);
router.get('/post/:slug/edit', userController.loggedIn, postController.editPostPage);
router.post('/post/:slug/edit', userController.loggedIn, postController.editPost);
router.post('/post/:slug/delete', userController.loggedIn, postController.deletePost);
router.post('/search', postController.search);

// Follow Routes
router.post('/follow/:username', userController.loggedIn, followController.addFollow);
router.post('/unfollow/:username', userController.loggedIn, followController.removeFollow)

module.exports = router