var assert = require('assert');
var _ = require('underscore');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var promise = require("bluebird");
var connect = require('./connectTestDB');
var wordSchema = require('./word');
var kanjiSchema = require('./kanji');
var wordConnectedSchema = require('./wordConnected');
var interfaces = require('./interfaces');


// Use native promises
mongoose.Promise = global.Promise;
promise.promisifyAll(require("mongoose"));

mongoose.connect('mongodb://localhost:27017/TestDB');

var KanjiModel = mongoose.model('Kanji', kanjiSchema);
var WordModel = mongoose.model('Word', wordSchema);

KanjiModel.findAsync({
    words: {
        $exists: false
    }
}).then(function (kanjis) {
    console.log('Number of kanjis without the words: ' + kanjis.length);
});

// find all the kanjis without the words assigned:
var query = KanjiModel.find({
    words: {
        $exists: false
    }
});

//query.or({
//    words: {
//        $size: 0
//    }
//});

query.execAsync().then(function (kanjis) {

    // for each such a kanji:
    kanjis.forEach(function (k) {
        // find the words that use it:
        WordModel.findAsync({
            word: new RegExp(k.character)
        }).then(function (words) {
            // drop the existing references:
            k.words = [];

            // then update the kanji with the references
            console.log('Found ' + words.length + ' words for kanji #' + k.character.charCodeAt(0) + ' ' + k.character + ' ' + k._id);

            var promises = [];
            words.forEach(function (w) {
                k.words.push(w._id);
            });

            k.save(function (error) {
                if (error) {
                    console.log(error);
                    process.exit(1);
                }
            });

        });
    });
});