const User = require('../models/userModel');

exports.register = function(req, res) {
  let user = new User(req.body);
  user.register();
  if (user.errors.length) {
    res.send(user.errors);
  } else {
    res.send("No errors");
  };
};

exports.login = function (req, res) {
  let user = new User(req.body)
  user.login()
    .then(function(result) {
      req.session.user = {username: user.data.username, firstname: user.data.firstname, _id: user.data._id};
      req.session.save(function() {
        res.redirect('/');
      });
    })
    .catch(function(error) {
      req.session.save(function() {
        res.redirect('/');
      });
    });
};

exports.logout = function() {

};

exports.home = async function (req, res) {
  // Fetch feed of posts for current user
  if (req.session.user) {
    res.render('home-dashboard', {username: req.session.user.username, firstname: req.session.user.firstname});
  } else {
    res.render('home-guest');
  };
};