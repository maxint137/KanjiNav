import { Exclude, Type } from "class-transformer";

export interface IMap<T> {
    [key: string]: T;
}

export type JlptLevel = 5 | 4 | 3 | 2 | 1 | 0;

export interface IJapaneseDictionary {
    lookupKanji(k: string): Promise<DbKanji>;
    lookupWord(word: string): Promise<DbWord>;
}

export class DictEntry {
    public dbId: string;
    public JLPT: JlptLevel;
    public english: string[];
}

export class WordCore extends DictEntry {
    public word: string;
    public hiragana: string;
}

export class DbWord extends WordCore {

    @Exclude()
    public kanjis: DbKanji[];
}

export class DbKanji extends DictEntry {
    public character: string;
    public onyomi: string[];
    public kunyomi: string[];

    @Exclude()
    public words: WordCore[];
}
