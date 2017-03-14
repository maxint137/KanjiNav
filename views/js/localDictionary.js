define(["require", "exports", "./kanjiNavBase"], function (require, exports, kanjiNavBase_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LocalDictionary = (function () {
        function LocalDictionary() {
        }
        LocalDictionary.prototype.lookup = function (type, id, jlptFilter) {
            var defer = $.Deferred();
            if (type.type == kanjiNavBase_1.NodeType.Word.type) {
                var word = words.filter(function (w) { return w.word == id; })[0];
                if (word) {
                    var wordApiRes_1 = {
                        _id: "5882353f4df6c031640-" + word["_id"]["$oid"],
                        word: word.word,
                        hiragana: word.hiragana,
                        JLPT: parseInt(word.JLPT),
                        english: word.english,
                        kanjis: LocalDictionary.loadKanji(word.word),
                    };
                    setTimeout(function () { return defer.resolve(wordApiRes_1); }, 1);
                }
            }
            else if (type.type == kanjiNavBase_1.NodeType.Char.type) {
                var kanji = kanjis.filter(function (k) { return k.character == id; })[0];
                var kanjiApiRes_1 = {
                    _id: "58883418e46ff154dc7-" + kanji["_id"]["$oid"],
                    character: kanji.character,
                    JLPT: parseInt(kanji.JLPT),
                    words: LocalDictionary.loadKanji(id)[0].words,
                    english: kanji.english,
                    kunyomi: kanji.kunyomi,
                    onyomi: kanji.onyomi
                };
                setTimeout(function () { return defer.resolve(kanjiApiRes_1); }, 1);
            }
            else {
                debugger;
            }
            return defer;
        };
        return LocalDictionary;
    }());
    LocalDictionary.loadKanji = function (word) {
        return kanjis.filter(function (k) { return 0 <= word.indexOf(k.character); })
            .map(function (k) {
            var kwords = k.words.map(function (kw) { return words.filter(function (w) { return w["_id"]["$oid"] == kw["$oid"]; })[0]; });
            return {
                __v: 1,
                JLPT: parseInt(k.JLPT),
                character: k.character,
                _id: "58883418e46ff154dc7-" + k["_id"]["$oid"],
                words: kwords
            };
        });
    };
    exports.Dictionary = new LocalDictionary();
});
//# sourceMappingURL=localDictionary.js.map