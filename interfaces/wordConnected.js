var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var word = require('./word');

var wordConnectedSchema = new mongoose.Schema({
    word: word.wordSchema,
    kanjis: [{
        type: Schema.Types.ObjectId,
        ref: 'Kanji'
    }],
    connections: [{
        type: Schema.Types.ObjectId,
        ref: 'Word'
    }]
});


module.exports = wordConnectedSchema;
module.exports.wordConnectedSchema = wordConnectedSchema;

