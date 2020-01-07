const mongodb = require('mongodb');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

mongodb.connect(process.env.DATABASE, {
  useNewUrlParser: true, 
  useUnifiedTopology: true}, function(err, client) {
  module.exports = client;
  const app = require('./app');
  app.listen(process.env.PORT);
});