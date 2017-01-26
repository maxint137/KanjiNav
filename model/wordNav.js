var mongoose = require('mongoose'), Schema = mongoose.Schema;
var Word = require('./word');

var WordNavSchema = new mongoose.Schema({
    word: Word.Schema,
    kanjis: [{
        type: Schema.Types.ObjectId,
        ref: 'Kanji'
    }]
});

module.exports = {
    Schema: WordNavSchema,
    Model: mongoose.model('WordNav', WordNavSchema)
};