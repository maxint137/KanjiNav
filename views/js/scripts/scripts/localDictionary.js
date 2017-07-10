define(["require", "exports", "./data"], function (require, exports, data_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LocalDictionary {
        parseJlpt(jlpt) {
            switch (parseInt(jlpt, 10)) {
                default:
                case 0: return 0;
                case 1: return 1;
                case 2: return 2;
                case 3: return 3;
                case 4: return 4;
                case 5: return 5;
            }
        }
        lookupKanji(id) {
            const promise = new Promise((resolve, reject) => {
                const kanji = data_1.kanjis.filter((k) => k.character === id)[0];
                if (!kanji) {
                    return reject(`Kanji not found for id=${id}`);
                }
                const kanjiApiRes = {
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
                setTimeout(() => resolve(kanjiApiRes), 137);
            });
            return promise;
        }
        lookupWord(id) {
            const promise = new Promise((resolve, reject) => {
                const word = data_1.words.filter((w) => w.word === id)[0];
                if (!word) {
                    return reject(`Word  not found for id=${id}`);
                }
                const wordApiRes = {
                    JLPT: this.parseJlpt(word.JLPT),
                    // tslint:disable-next-line:no-string-literal
                    dbId: "5882353f4df6c031640-" + word["_id"]["$oid"],
                    english: word.english,
                    hiragana: word.hiragana,
                    kanjis: LocalDictionary.loadKanji(word.word),
                    word: word.word,
                };
                setTimeout(() => resolve(wordApiRes), 137);
            });
            return promise;
        }
    }
    LocalDictionary.loadKanji = (word) => {
        return data_1.kanjis.filter((k) => 0 <= word.indexOf(k.character))
            .map((k) => {
            const kWords = k.words.map((kw) => data_1.words.filter((w) => 
            // tslint:disable-next-line:no-string-literal
            w["_id"]["$oid"] === kw["$oid"])[0]);
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
    exports.LocalDictionary = LocalDictionary;
    exports.Dictionary = new LocalDictionary();
});
//# sourceMappingURL=localDictionary.js.map