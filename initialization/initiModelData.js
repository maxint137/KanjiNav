var mongoose = require('mongoose');
var promise = require("bluebird");
var db = require('./../model/db');
var KanjiModel = require('./../model/kanji');
var WordModel = require('./../model/word').WordModel;
var WordNavModel = require('./../model/wordNav');

// Use native promises
mongoose.Promise = global.Promise;
promise.promisifyAll(require("mongoose"));

//mongoose.connection.close();


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

//query.exec().then(function (kanjis) {
KanjiModel.findAsync({
    words: {
        $exists: false
    }
}).then(function (kanjis) {

    console.log('Number of kanjis with missing words: ' + kanjis.length);

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
}).then(function () {
    console.log("<<< DONE >>");
    //mongoose.connection.close();
});