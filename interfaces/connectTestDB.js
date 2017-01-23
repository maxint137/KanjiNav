var mongodb = require('mongodb');
var uri = 'mongodb://localhost:27017/TestDB';

module.exports = function(callback) {
  mongodb.MongoClient.connect(uri, callback);
};
