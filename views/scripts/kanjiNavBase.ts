export class NodeType {
    constructor(
        public type: string,
        public id: string,      // the name of the ID field
        public castSel: string,
    ) { }

    toString(): string {
        return this.type;
    }

    next(): NodeType {
        return this === NodeType.Word ? NodeType.Char : NodeType.Word;
    }

    static Word: NodeType = new NodeType("word", "word", 'kanjis');
    static Char: NodeType = new NodeType("kanji", "character", 'words');
}

export interface JLPTDictionary {
    lookup(type: NodeType, id: string, jlptFilter: string): JQueryPromise<any>;
}

export class ApiNode {
    JLPT: number;
    _id: string;
    english: string[];
    hiragana: string;
    kanjis: string[];
    word: string;
}
