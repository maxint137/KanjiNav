var mongoose = require('mongoose');

var wordSchema = new mongoose.Schema({
    word: {
        type: String,
        required: true,
        maxlength: 25 //グレートブリテンおよび北アイルランド連合王国 has 22 letters, and is the longest word
    },
    hiragana: {
        type: String,
        maxlength: 50,
        required: true
    },
    english: [{
        type: String,
        maxlength: 50, //pneumonoultramicroscopicsilicovolcanoconiosis
        required: true
    }],
    JLPT: {
        type: Number,
        min: 1,
        max: 5
    },
});

module.exports = wordSchema;
module.exports.wordSchema = wordSchema;
