import { Exclude, Type } from "class-transformer";

import * as KNApi from "./knApi";

export type NodeTypes = "Word" | "Kanji";
export function opposite(tp: NodeTypes): NodeTypes {
    return tp === "Word" ? "Kanji" : "Word";
}

export interface INode {
    // the text
    text: string;
    // the type
    type: NodeTypes;
    // the ID: text-type
    id: string;

    title: string[];
    subscript: string[];
    superscript: string[];
    hint: string[];
    JLPT: KNApi.JlptLevel;

    isKanji: boolean;

    hood: INeighborID[];

    degree: number;
}

export interface INeighborID {
    readonly id: string;
    readonly text: string;
}

export abstract class BaseNode {

    public static makeId(type: string, text: string): string {
        return `${type}_${text}`;
    }

    public degree: number;

    //public nodeData: KNApi.DictEntry;

    protected hoodData: INeighborID[];
}

export class WordNode extends BaseNode implements INode {

    public get dbWord(): KNApi.DbWord {
        return this.nodeData as KNApi.DbWord;
    }

    @Type(() => KNApi.DbWord)
    public nodeData: KNApi.DbWord;

    constructor(nodeData: KNApi.DbWord) {
        super();

        // when de-serialized the parameter is undefined
        if (typeof nodeData === "undefined") {
            return;
        }

        this.nodeData = nodeData;

        this.hoodData = this.dbWord.kanjis.map((kanji: KNApi.DbKanji & KNApi.DbWord) => {
            return {
                id: WordNode.makeId("Kanji", kanji.character),
                text: kanji.character,
            };
        });
    }

    get text(): string {
        return this.dbWord.word;
    }
    get type(): NodeTypes {
        return "Word";
    }

    get title(): string[] {
        return [this.dbWord.word];
    }
    get subscript(): string[] {
        return [this.dbWord.english[0] + (1 < this.dbWord.english.length ? "..." : "")];
    }
    get superscript(): string[] {
        return [this.dbWord.hiragana];
    }

    get JLPT(): KNApi.JlptLevel {
        return this.nodeData.JLPT;
    }

    get hint(): string[] {
        return this.nodeData.english;
    }

    get isKanji(): boolean {
        return this.type === "Kanji";
    }

    get id(): string {
        return BaseNode.makeId(this.type, this.text);
    }

    get hood(): INeighborID[] {
        return this.hoodData;
    }
}

export class KanjiNode extends BaseNode implements INode {

    public get dbKanji(): KNApi.DbKanji {
        return this.nodeData as KNApi.DbKanji;
    }

    @Type(() => KNApi.DbKanji)
    public nodeData: KNApi.DbKanji;

    constructor(nodeData: KNApi.DbKanji) {
        super();

        // when de-serialized the parameter is undefined
        if (typeof nodeData === "undefined") {
            return;
        }
        this.nodeData = nodeData;

        this.hoodData = this.dbKanji.words.map((word: KNApi.DbKanji & KNApi.DbWord) => {
            return {
                id: WordNode.makeId("Word", word.word),
                text: word.word,
            };
        });
    }

    get text(): string {
        return this.dbKanji.character;
    }
    get type(): NodeTypes {
        return "Kanji";
    }

    get title(): string[] {
        return [this.dbKanji.character];
    }
    get subscript(): string[] {
        return [this.dbKanji.onyomi[0]];
    }
    get superscript(): string[] {
        return [this.dbKanji.kunyomi[0]];
    }

    get JLPT(): KNApi.JlptLevel {
        return this.nodeData.JLPT;
    }

    get hint(): string[] {
        return this.nodeData.english;
    }

    get isKanji(): boolean {
        return this.type === "Kanji";
    }

    get id(): string {
        return BaseNode.makeId(this.type, this.text);
    }

    get hood(): INeighborID[] {
        return this.hoodData;
    }
}

// just the opposite of what they recommend in
// https://stackoverflow.com/questions/42634116/factory-returning-classes-in-typescript
export function nodeFactory(type: NodeTypes, dbData: KNApi.DbWord & KNApi.DbKanji): INode {

    if (type === "Word") {
        return new WordNode(dbData);
    }
    if (type === "Kanji") {
        return new KanjiNode(dbData);
    }

    throw new Error(`Unexpected node type: ${type}`);
}

// Very simple - just keep track of the source/target nodes' names
export class Edge {
    // edge is always towards the actor/char
    public static makeEdge(
        type: NodeTypes,
        thisName: string,
        otherName: string): Edge {

        // make sure the edges start from word, end at kanji
        return type === "Word" ? new Edge(thisName, otherName) : new Edge(otherName, thisName);
    }

    constructor(public source: string, public target: string) { }

    public toString(): string { return `${this.source}-${this.target}`; }
}
