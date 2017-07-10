var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var KanjiSchema = module.exports = new mongoose.Schema({
    character: {
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
    words: [{
        type: Schema.Types.ObjectId,
        ref: 'Word'
    }]
});