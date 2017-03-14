import { ApiNode, JLPTDictionary, NodeType } from './kanjiNavBase'

// defined in data.js
declare var kanjis;
declare var words;

class LocalDictionary implements JLPTDictionary {

    private static loadKanji: (word: string) => any = (word: string) => {
        return kanjis.filter(k => 0 <= word.indexOf(k.character))
            .map(k => {

                let kwords = k.words.map(kw => words.filter(w => w["_id"]["$oid"] == kw["$oid"])[0]);

                return {
                    __v: 1,
                    JLPT: parseInt(k.JLPT),
                    character: k.character,
                    _id: "58883418e46ff154dc7-" + k["_id"]["$oid"],
                    words: kwords
                };
            });
    }

    lookup(type: NodeType, id: string, jlptFilter: string): JQueryPromise<any> {

        let defer = $.Deferred();

        if (type.type == NodeType.Word.type) {
            let word = words.filter(w => w.word == id)[0];

            if (word) {
                let wordApiRes: ApiNode = {

                    _id: "5882353f4df6c031640-" + word["_id"]["$oid"],
                    word: word.word,
                    hiragana: word.hiragana,
                    JLPT: parseInt(word.JLPT),
                    english: word.english,
                    kanjis: LocalDictionary.loadKanji(word.word),
                };

                setTimeout(() => defer.resolve(wordApiRes), 137);
            }
        }
        else if (type.type == NodeType.Char.type) {

            let kanji = kanjis.filter(k => k.character == id)[0];

            let kanjiApiRes: any = {
                _id: "58883418e46ff154dc7-" + kanji["_id"]["$oid"],
                character: kanji.character,
                JLPT: parseInt(kanji.JLPT),
                words: LocalDictionary.loadKanji(id)[0].words,
                english: kanji.english,
                kunyomi: kanji.kunyomi,
                onyomi: kanji.onyomi
            };

            setTimeout(() => defer.resolve(kanjiApiRes), 137);
        }
        else {
            debugger;
        }

        return defer;
    }
}

export let Dictionary: JLPTDictionary = new LocalDictionary();
