/// import "/views/node_modules/@types/jquery/index.d";
define(["require", "exports", "./data"], function (require, exports, data_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var LocalDictionary = (function () {
        function LocalDictionary() {
        }
        LocalDictionary.prototype.parseJlpt = function (jlpt) {
            switch (parseInt(jlpt, 10)) {
                default:
                case 0: return 0;
                case 1: return 1;
                case 2: return 2;
                case 3: return 3;
                case 4: return 4;
                case 5: return 5;
            }
        };
        LocalDictionary.prototype.lookupKanji = function (id) {
            var result = $.Deferred();
            var kanji = data_1.kanjis.filter(function (k) { return k.character === id; })[0];
            var kanjiApiRes = {
                JLPT: this.parseJlpt(kanji.JLPT),
                // tslint:disable-next-line:no-string-literal
                character: kanji.character,
                // tslint:disable-next-line:no-string-literal
                dbId: "58883418e46ff154dc7-" + kanji["_id"]["$oid"],
                english: kanji.english,
                kunyomi: kanji.kunyomi,
                onyomi: kanji.onyomi,
                words: LocalDictionary.loadKanji(id)[0].words,
            };
            setTimeout(function () { return result.resolve(kanjiApiRes); }, 137);
            return result;
        };
        LocalDictionary.prototype.lookupWord = function (id) {
            var result = $.Deferred();
            var word = data_1.words.filter(function (w) { return w.word === id; })[0];
            if (word) {
                var wordApiRes_1 = {
                    JLPT: this.parseJlpt(word.JLPT),
                    // tslint:disable-next-line:no-string-literal
                    dbId: "5882353f4df6c031640-" + word["_id"]["$oid"],
                    english: word.english,
                    hiragana: word.hiragana,
                    kanjis: LocalDictionary.loadKanji(word.word),
                    word: word.word,
                };
                setTimeout(function () { return result.resolve(wordApiRes_1); }, 137);
            }
            return result;
        };
        return LocalDictionary;
    }());
    LocalDictionary.loadKanji = function (word) {
        return data_1.kanjis.filter(function (k) { return 0 <= word.indexOf(k.character); })
            .map(function (k) {
            // tslint:disable-next-line:no-string-literal
            var kWords = k.words.map(function (kw) { return data_1.words.filter(function (w) { return w["_id"]["$oid"] === kw["$oid"]; })[0]; });
            return {
                JLPT: parseInt(k.JLPT, 10),
                __v: 1,
                // tslint:disable-next-line:no-string-literal
                _id: "58883418e46ff154dc7-" + k["_id"]["$oid"],
                character: k.character,
                words: kWords,
            };
        });
    };
    exports.Dictionary = new LocalDictionary();
});
//# sourceMappingURL=localDictionary.js.map