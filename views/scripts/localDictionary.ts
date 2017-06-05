/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="knApi.ts" />

import { kanjis } from './data'
import { words } from './data'

class LocalDictionary implements KNApi.JapaneseDictionary {

    private static loadKanji: (word: string) => any = (word: string) => {
        return kanjis.filter((k: any) => 0 <= word.indexOf(k.character))
            .map((k: any) => {

                let kWords = k.words.map((kw: any) => words.filter((w: any) => w["_id"]["$oid"] == kw["$oid"])[0]);

                return {
                    __v: 1,
                    JLPT: parseInt(k.JLPT),
                    character: k.character,
                    _id: "58883418e46ff154dc7-" + k["_id"]["$oid"],
                    words: kWords
                };
            });
    }

    parseJlpt(jlpt: string): KNApi.JlptLevel {

        switch (parseInt(jlpt)) {
            default:
            case 0: return 0;
            case 1: return 1;
            case 2: return 2;
            case 3: return 3;
            case 4: return 4;
            case 5: return 5;
        }
    }

    lookupKanji(id: string): JQueryPromise<KNApi.DbKanji> {

        let result: JQueryDeferred<KNApi.DbKanji> = $.Deferred<KNApi.DbKanji>();

        let kanji = kanjis.filter((k: any) => k.character == id)[0];

        let kanjiApiRes: KNApi.DbKanji = {
            _dbId: "58883418e46ff154dc7-" + kanji["_id"]["$oid"],
            character: kanji.character,
            JLPT: this.parseJlpt(kanji.JLPT),
            words: LocalDictionary.loadKanji(id)[0].words,
            english: kanji.english,
            kunyomi: kanji.kunyomi,
            onyomi: kanji.onyomi
        };

        setTimeout(() => result.resolve(kanjiApiRes), 137);

        return result;
    }

    lookupWord(id: string): JQueryPromise<KNApi.DbWord> {

        let result: JQueryDeferred<KNApi.DbWord> = $.Deferred<KNApi.DbWord>();

        let word = words.filter((w: any) => w.word == id)[0];

        if (word) {
            let wordApiRes: KNApi.DbWord = {

                _dbId: "5882353f4df6c031640-" + word["_id"]["$oid"],
                word: word.word,
                hiragana: word.hiragana,
                JLPT: this.parseJlpt(word.JLPT),
                english: word.english,
                kanjis: LocalDictionary.loadKanji(word.word),
            };

            setTimeout(() => result.resolve(wordApiRes), 137);
        }

        return result;
    }
}

export let Dictionary: KNApi.JapaneseDictionary = new LocalDictionary();

