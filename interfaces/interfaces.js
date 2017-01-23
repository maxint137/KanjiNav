// Given a Jananese work returns the words that contain some 
// shared kanji characters. These are sorted by JLPT in decreasing order.
exports.getConnectedWords = function (db, word, callback) {

    var findWordTasks = getConnectedWordTasks(db, word);
    if (null == findWordTasks) {
        callback(null, []);
    }

    require('async').parallel(findWordTasks, function (err, taskResults) {

        var allWords = [];
        taskResults.forEach(function (taskResult) {

            allWords = allWords.concat(taskResult.words);
        });

        callback(null, allWords);
    });
};

// Given a Jananese work returns the words that contain some 
// shared kanji characters. These are sorted by JLPT in decreasing order.
// The result is an array of {words[],kanji} pairs
exports.getConnectedWordsGrouped = function (db, word, callback) {

    var findWordTasks = getConnectedWordTasks(db, word);
    if (null == findWordTasks) {
        callback(null, []);
    }

    require('async').parallel(findWordTasks, function (err, taskResults) {

        callback(null, taskResults);
    });
};


function getConnectedWordTasks(db, word) {

    // match the range: 0x4e00 - 0x9faf  (http://www.rikai.com/library/kanjitables/kanji_codes.unicode.shtml)
    var kanjiRex = /[\u4e00-\u9faf]/g;

    // filter out katakana and hiragana chars
    var kanjis = word.match(kanjiRex);
    if (null == kanjis) {
        return null;
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
                else cb(null, {
                    words: items,
                    kanji: kanji
                });
            });
        });
    });

    return findWordTasks;
}