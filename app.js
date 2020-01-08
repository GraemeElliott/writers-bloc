const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const markdown = require('marked');
const app = express();

let sessionOptions = session({
  secret: 'The Secret Session Option',
  store: new MongoStore({client: require('./server'), dbName: 'writersbloc'}),
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
});

app.use(sessionOptions);
app.use(flash());

app.use(function(req, res, next) {
  // Make our Markdown function available within templates
  res.locals.filterUserHTML = function(content) {
    return markdown(content);
  };
  
  // Make all error and success flash messages available
  res.locals.errors = req.flash('errors');
  res.locals.success = req.flash('success');

  // Make Used IF available on req object
  if (req.session.user) {req.visitorId = req.session.user._id} 
  else {req.visitorId = 0};

  // Make user session data available from within view templates
  res.locals.user = req.session.user;
  next();
});

const router = require('./router');

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use(express.static('public'));
app.set('views', 'views');
app.set('view engine', 'ejs');

app.use('/', router);

module.exports = app;