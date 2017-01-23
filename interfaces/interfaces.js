// match the range: 0x4e00 - 0x9faf  (http://www.rikai.com/library/kanjitables/kanji_codes.unicode.shtml)
var kanjiRex = /[\u4e00-\u9faf]/g;

// Given a Jananese work returns the words that contain some 
// shared kanji characters. These are sorted by JLPT in decreasing order.
exports.getConnectedWords = function (db, word, callback) {

    // filter out katakana and hiragana chars
    var kanjis = word.match(kanjiRex);
    if (null == kanjis) {
        callback(null, []);
    }

    var findWordTasks = [];
    kanjis.forEach(function (kanji) {

        findWordTasks.push(function (cb) {

            db.collection('wordDocsOrg').find({
                word: new RegExp(kanji)
            }).sort({
                JLPT: -1
            }).toArray(function (err, items) {
                if (err) cb(err);
                else cb(null, items);
            });
        });
    });

    require('async').parallel(findWordTasks, function (err, words) {

        var allWords = [];
        words.forEach(function (word) {
            allWords = allWords.concat(word);
        });

        callback(null, allWords);
    });
}
