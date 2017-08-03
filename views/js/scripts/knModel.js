define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function opposite(tp) {
        return tp === "Word" ? "Kanji" : "Word";
    }
    exports.opposite = opposite;
    class BaseNode {
        constructor(dictEntry) {
            this.dictEntry = dictEntry;
        }
        static makeId(type, text) {
            return `${type}_${text}`;
        }
        get JLPT() {
            return this.dictEntry.JLPT;
        }
        get hint() {
            return this.dictEntry.english;
        }
        get isKanji() {
            return this.type === "Kanji";
        }
        get id() {
            return BaseNode.makeId(this.type, this.text);
        }
        get hood() {
            return this.hoodData;
        }
        get title() {
            throw new Error("Base class implementation was called.");
        }
        get subscript() {
            throw new Error("Base class implementation was called.");
        }
        get superscript() {
            throw new Error("Base class implementation was called.");
        }
        get text() {
            throw new Error("Base class implementation was called.");
        }
        get type() {
            throw new Error("Base class implementation was called.");
        }
    }
    exports.BaseNode = BaseNode;
    class WordNode extends BaseNode {
        constructor(dbWord) {
            super(dbWord);
            this.dbWord = dbWord;
            // when de-serialized the parameter is undefined
            if (typeof dbWord === "undefined") {
                return;
            }
            this.hoodData = this.dbWord.kanjis.map((kanji) => {
                return {
                    id: WordNode.makeId("Kanji", kanji.character),
                    text: kanji.character,
                };
            });
        }
        get text() {
            return this.dbWord.word;
        }
        get type() {
            return "Word";
        }
        get title() {
            return [this.dbWord.word];
        }
        get subscript() {
            return [this.dbWord.english[0] + (1 < this.dbWord.english.length ? "..." : "")];
        }
        get superscript() {
            return [this.dbWord.hiragana];
        }
    }
    exports.WordNode = WordNode;
    class KanjiNode extends BaseNode {
        constructor(dbKanji) {
            super(dbKanji);
            this.dbKanji = dbKanji;
            // when de-serialized the parameter is undefined
            if (typeof dbKanji === "undefined") {
                return;
            }
            this.hoodData = this.dbKanji.words.map((word) => {
                return {
                    id: WordNode.makeId("Word", word.word),
                    text: word.word,
                };
            });
        }
        get text() {
            return this.dbKanji.character;
        }
        get type() {
            return "Kanji";
        }
        get title() {
            return [this.dbKanji.character];
        }
        get subscript() {
            return [this.dbKanji.onyomi[0]];
        }
        get superscript() {
            return [this.dbKanji.kunyomi[0]];
        }
    }
    exports.KanjiNode = KanjiNode;
    // just the opposite of what they recommend in
    // https://stackoverflow.com/questions/42634116/factory-returning-classes-in-typescript
    function nodeFactory(type, dbData) {
        if (type === "Word") {
            return new WordNode(dbData);
        }
        if (type === "Kanji") {
            return new KanjiNode(dbData);
        }
        throw new Error(`Unexpected node type: ${type}`);
    }
    exports.nodeFactory = nodeFactory;
    // Very simple - just keep track of the source/target nodes' names
    class Edge {
        constructor(source, target) {
            this.source = source;
            this.target = target;
        }
        // edge is always towards the actor/char
        static makeEdge(type, thisName, otherName) {
            // make sure the edges start from word, end at kanji
            return type === "Word" ? new Edge(thisName, otherName) : new Edge(otherName, thisName);
        }
        toString() { return `${this.source}-${this.target}`; }
    }
    exports.Edge = Edge;
});
//# sourceMappingURL=knModel.js.map