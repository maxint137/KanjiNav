import * as KNApi from "knApi";

import { kanjis, words } from "./data";

class LocalDictionary implements KNApi.IJapaneseDictionary {

    private static loadKanji: (word: string) => any = (word: string) => {
        return kanjis.filter((k: any) => 0 <= word.indexOf(k.character))
            .map((k: any) => {

                // tslint:disable-next-line:no-string-literal
                const kWords = k.words.map((kw: any) => words.filter((w: any) => w["_id"]["$oid"] === kw["$oid"])[0]);

                return {
                    JLPT: parseInt(k.JLPT, 10),
                    __v: 1,
                    // tslint:disable-next-line:no-string-literal
                    _id: "58883418e46ff154dc7-" + k["_id"]["$oid"],
                    character: k.character,
                    words: kWords,
                };
            });
    }

    public parseJlpt(jlpt: string): KNApi.JlptLevel {

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

    public lookupKanji(id: string): JQueryPromise<KNApi.DbKanji> {

        const result: JQueryDeferred<KNApi.DbKanji> = $.Deferred<KNApi.DbKanji>();

        const kanji = kanjis.filter((k: any) => k.character === id)[0];

        const kanjiApiRes: KNApi.DbKanji = {
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

        setTimeout(() => result.resolve(kanjiApiRes), 137);

        return result;
    }

    public lookupWord(id: string): JQueryPromise<KNApi.DbWord> {

        const result: JQueryDeferred<KNApi.DbWord> = $.Deferred<KNApi.DbWord>();

        const word = words.filter((w: any) => w.word === id)[0];

        if (word) {
            const wordApiRes: KNApi.DbWord = {

                JLPT: this.parseJlpt(word.JLPT),
                // tslint:disable-next-line:no-string-literal
                dbId: "5882353f4df6c031640-" + word["_id"]["$oid"],
                english: word.english,
                hiragana: word.hiragana,
                kanjis: LocalDictionary.loadKanji(word.word),
                word: word.word,
            };

            setTimeout(() => result.resolve(wordApiRes), 137);
        }

        return result;
    }
}

export let Dictionary: KNApi.IJapaneseDictionary = new LocalDictionary();
