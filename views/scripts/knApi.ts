/// <reference path="../node_modules/@types/jquery/index.d.ts" />

namespace KNApi {
    
    export type JlptLevel = 5 | 4 | 3 | 2 | 1 | 0;

    export interface JapaneseDictionary {
        lookupKanji(k: string): JQueryPromise<DbKanji>;
        lookupWord(word: string): JQueryPromise<DbWord>;
    }

    export class DictEntry {
        _dbId: string;
        JLPT: JlptLevel;
        english: string[];
    }

    export class WordCore extends DictEntry {
        word: string;
        hiragana: string;
    }

    export class DbWord extends WordCore {
        kanjis: DbKanji[];
    }

    export class DbKanji extends DictEntry {
        character: string;
        onyomi: string[];
        kunyomi: string[];
        words: WordCore[];
    }
}
