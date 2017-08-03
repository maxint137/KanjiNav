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

    //@Type(() => INeighborID)
    hood: INeighborID[];

    degree: number;
}

export interface INeighborID {
    readonly id: string;
    readonly text: string;
}

export class BaseNode implements INode {

    public static makeId(type: string, text: string): string {
        return `${type}_${text}`;
    }

    public degree: number;
    protected hoodData: INeighborID[];

    constructor(public dictEntry: KNApi.DictEntry) {
    }

    get JLPT(): KNApi.JlptLevel {
        return this.dictEntry.JLPT;
    }

    get hint(): string[] {
        return this.dictEntry.english;
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

    get title(): string[] {
        throw new Error("Base class implementation was called.");
    }
    get subscript(): string[] {
        throw new Error("Base class implementation was called.");
    }
    get superscript(): string[] {
        throw new Error("Base class implementation was called.");
    }
    get text(): string {
        throw new Error("Base class implementation was called.");
    }
    get type(): NodeTypes {
        throw new Error("Base class implementation was called.");
    }
}

export class WordNode extends BaseNode implements INode {

    constructor(public dbWord: KNApi.DbWord) {
        super(dbWord);

        // when de-serialized the parameter is undefined
        if (typeof dbWord === "undefined") {
            return;
        }

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
}

export class KanjiNode extends BaseNode implements INode {

    constructor(public dbKanji: KNApi.DbKanji) {
        super(dbKanji);

        // when de-serialized the parameter is undefined
        if (typeof dbKanji === "undefined") {
            return;
        }

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
