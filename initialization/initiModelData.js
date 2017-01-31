// infra
var Promise = require("bluebird");
var Mongoose = Promise.promisifyAll(require('mongoose'));
var wagner = require('wagner-core');

require('./../model/models')(wagner);

wagner.invoke(function (Kanji) {

// find all the kanjis without the assigned words:
Kanji.findAsync({
    words: {
        $exists: false
    }
}).then(function (kanjis) {

    console.log('Number of kanjis with missing words: ' + kanjis.length);

    Promise.map(kanjis, function (nextKanji, index) {

        console.log("Kick find-words for #" + index + ", " + nextKanji.character);

        var words = [];
        wagner.invoke(function (Word) {
            words = Word.findAsync({
                word: new RegExp(nextKanji.character)
            });
        });

        return words;
    }, {concurrency: 7}).map(function (words, index) {
        console.log('Mapping ' + words.length + ' words for ' + kanjis[index].character + ' #' + index);

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
});

return;

