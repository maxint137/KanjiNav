// infra
var Promise = require("bluebird");
var Mongoose = Promise.promisifyAll(require('mongoose'));

// app
var Db = require('./../model/db');
var KanjiModel = require('./../model/kanji').Model;
var WordModel = require('./../model/word').Model;

// find all the kanjis without the assigned words:
KanjiModel.findAsync({
    words: {
        $exists: false
    }
}).then(function (kanjis) {

    console.log('Number of kanjis with missing words: ' + kanjis.length);

    Promise.map(kanjis, function (nextKanji, index) {

        console.log("Kick find-words for #" + index + ", " + nextKanji.character.charCodeAt(0));

        var words = WordModel.findAsync({
            word: new RegExp(nextKanji.character)
        });

        return words;
    }, {concurrency: 7}).map(function (words, index) {
        console.log('Mapping ' + words.length + ' words for ' + kanjis[index].character.charCodeAt(0) + ' #' + index);

        words.forEach(function (w) {
            kanjis[index].words.push(w._id);
        });

        // save the change:
        return kanjis[index].save(function (error) {
            if (error) {
                console.log(error);
                process.exit(1);
            }
        });
    }).then(function () {
        console.log("<<< DONE!!! >>>");
        process.exit(0);
    }).catch(function (e) {
        console.log(e);
        process.exit(-1);
    });
});