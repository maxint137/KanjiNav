var Promise = require("bluebird");
var mongoose = Promise.promisifyAll(require('mongoose')),
    Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

var WordSchema = require('./word');

var WordNavSchema = module.exports = new mongoose.Schema({
    word: WordSchema,
    kanjis: [{
        type: Schema.Types.ObjectId,
        ref: 'Kanji'
    }]
});