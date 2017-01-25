var mongoose = require('mongoose'), Schema = mongoose.Schema;
var Word = require('./word');

var WordNavSchema = new mongoose.Schema({
    word: Word.WordSchema,
    kanjis: [{
        type: Schema.Types.ObjectId,
        ref: 'Kanji'
    }]
});

var WordNav = module.exports = mongoose.model('WordNav', WordNavSchema);