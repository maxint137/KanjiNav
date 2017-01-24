var mongoose = require('mongoose');

var kanjiSchema = new mongoose.Schema({
    kanji: {
        type: String,
        required: true,
        maxlength: 1
    },
    onyomi: [{
        type: String,
        maxlength: 10,
    }],
    kunyomi: [{
        type: String,
        maxlength: 10,
    }],
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

module.exports = kanjiSchema;
module.exports.kanjiSchema = kanjiSchema;