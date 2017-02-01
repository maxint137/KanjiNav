var Promise = require("bluebird");
var mongoose = Promise.promisifyAll(require('mongoose')),
    Schema = mongoose.Schema;
var _ = require("underscore");

mongoose.Promise = global.Promise;

module.exports = function (wagner) {

    mongoose.connect('mongodb://localhost:27017/TestDB');
    
    var models = {
        Kanji: mongoose.model('Kanji', require('./kanji')),
        Word: mongoose.model('Word', require('./word')),
    };
    
    _.each(models, function(value, key){
        wagner.factory(key, function() {
            return value;
        })
    })
    
    return models;
};
