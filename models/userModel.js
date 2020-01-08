const usersCollection = require('../server').db().collection('users'),
      validator = require('validator'),
      bcrypt = require('bcryptjs'),
      md5 = require('md5');

let User = function(data, getAvatar) {
  this.data = data;
  this.errors = [];
  if (getAvatar == undefined) {getAvatar = false};
  if (getAvatar) {this.getAvatar()};
};

User.prototype.cleanUp = function () {
  if (typeof(this.data.firstname) != "string") {
    this.data.firstname = ""
  };

  if (typeof(this.data.surname) != "string") {
    this.data.surname = ""
  };

  if (typeof(this.data.username) != "string") {
    this.data.username = ""
  };
  if (typeof(this.data.email) != "string") {
    this.data.email = ""
  };
  if (typeof(this.data.password) != "string") {
    this.data.password = ""
  };

  // Remove unwanted properties
  this.data = {
    firstname: this.data.firstname.trim(),
    surname: this.data.surname.trim(),
    username: this.data.username.toLowerCase(),
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password,
    passwordConfirm: this.data.passwordConfirm
  };
};

User.prototype.validate = function() {
  return new Promise(async (resolve, reject) => {

    if (this.data.firstname == "") {
      this.errors.push("You must provide a first name")
    };

    if (this.data.surname == "") {
      this.errors.push("You must provide a surname")
    };

    if (this.data.username == "") {
      this.errors.push("You must provide a username")
    };
    if (this.data.username.length < 5) {
      this.errors.push("Username length must be at least 5 characters")
    };
    if (this.data.username.length > 20) {
      this.errors.push("Username length cannot exceed 20 characters")
    };
    if (this.data.username !="" && !validator.isAlphanumeric(this.data.username)) {
      this.errors.push("Username can only contain letters and numbers")
    };
    if (!validator.isEmail(this.data.email)) {
      this.errors.push("You must provide a valid email address")
    };
    if (this.data.password == "") {
      this.errors.push("You must provide a password")
    };
    if (this.data.passwordConfirm !== this.data.password) {
      this.errors.push("Password confirmation did not match password")
    };
    if (this.data.password.length > 0 && this.data.password < 8) {
      this.errors.push("Password length must be at least 8 characters")
    };
    if (this.data.password.length > 30) {
      this.errors.push("Password length cannot exceed 30 characters")
    };
  
    // Only if username is valid then check to see if it has been taken
    if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username))  {
      let usernameExists = await usersCollection.findOne({username: this.data.username});
      if (usernameExists) {this.errors.push('That username is taken')}
    };
  
    // Only if email is valid then check to see if it has been taken
    if (validator.isEmail(this.data.email))  {
      let emailExists = await usersCollection.findOne({email: this.data.email});
      if (emailExists) {this.errors.push('That email address is already being used')}
    };
    resolve();
  });
};


User.prototype.register = function() {
  return new Promise(async (resolve, reject) => {
    // Step #1: Validate user data
    this.cleanUp();
    await this.validate();
  
    // Step #2: Only if there are no validation errors
    // then save user data into a database
    if (!this.errors.length) {
      // hash user password
      let salt = bcrypt.genSaltSync(10);
      this.data.password = bcrypt.hashSync(this.data.password, salt);
      this.data.passwordConfirm = this.data.password;
      await usersCollection.insertOne(this.data);
      this.getAvatar();
      resolve();
    } else {
      reject(this.errors);
    };
  });
};

User.prototype.login = function() {
  return new Promise((resolve, reject) => {
    this.cleanUp();
    usersCollection.findOne({username: this.data.username})
      .then((loggedInUser) => {
        if (loggedInUser && bcrypt.compareSync(this.data.password, loggedInUser.password)) {
          this.data = loggedInUser;
          this.getAvatar();
          resolve("Logged in");
        } else {
          reject("Invalid username/password");
        };
      }).catch(() => {
        reject("Please try again later")
      });
  });
};

User.prototype.getAvatar = function() {
  this.avatar = `https://secure.gravatar.com/avatar/${md5(this.data.email)}?s=128`
};

User.findByUsername = function(username) {
  return new Promise (function(resolve, reject) {
    if (typeof(username) != 'string') {
      reject()
      return
    };
    usersCollection.findOne({username: username})
    .then(function(userDocument) {
      if (userDocument) {
        userDocument = new User (userDocument, true)
        userDocument = {
          _id: userDocument.data._id,
          username: userDocument.data.username,
          avatar: userDocument.avatar
        }
          resolve(userDocument)
      } else {
        reject();
      };
    }).catch(function() {
      reject();
    });
  });
};

User.doesEmailExist = function(email) {
  return new Promise(async function(resolve, reject) {
    if (typeof(email) !='string') {
      resolve(false);
      return
    }
    let user = await usersCollection.findOne({email: email});
    if (user) {
      resolve(true);
    } else {
      resolve(false);
    };
  });
};

module.exports = User;