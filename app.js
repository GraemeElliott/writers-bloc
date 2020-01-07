const express = require('express');
const router = require('./router');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);


const app = express();

let sessionOptions = session({
  secret: 'Secret Session',
  store: new MongoStore({client: require('./server'), dbName: 'writersbloc'}),
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true}
});

app.use(sessionOptions);

app.use(express.static("public"));
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.set('views', 'views');
app.set('view engine', 'ejs');

app.use('/', router);

module.exports = app;