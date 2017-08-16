var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "class-transformer", "./knApi"], function (require, exports, class_transformer_1, KNApi) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function opposite(tp) {
        return tp === "Word" ? "Kanji" : "Word";
    }
    exports.opposite = opposite;
    class BaseNode {
        static makeId(type, text) {
            return `${type}_${text}`;
        }
    }
    exports.BaseNode = BaseNode;
    class WordNode extends BaseNode {
        constructor(nodeData) {
            super();
            // when de-serialized the parameter is undefined
            if (typeof nodeData === "undefined") {
                return;
            }
            this.nodeData = nodeData;
            this.hoodData = this.dbWord.kanjis.map((kanji) => {
                return {
                    id: WordNode.makeId("Kanji", kanji.character),
                    text: kanji.character,
                };
            });
        }
        get dbWord() {
            return this.nodeData;
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
            const MaxCharsInSubscript = 10;
            if (MaxCharsInSubscript < this.dbWord.english[0].length) {
                return [this.dbWord.english[0].slice(0, MaxCharsInSubscript) + "..."];
            }
            return [this.dbWord.english[0] + (1 < this.dbWord.english.length ? "..." : "")];
        }
        get superscript() {
            return [this.dbWord.hiragana];
        }
        get JLPT() {
            return this.nodeData.JLPT;
        }
        get hint() {
            return this.nodeData.english;
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
    }
    __decorate([
        class_transformer_1.Type(() => KNApi.DbWord)
    ], WordNode.prototype, "nodeData", void 0);
    exports.WordNode = WordNode;
    class KanjiNode extends BaseNode {
        constructor(nodeData) {
            super();
            // when de-serialized the parameter is undefined
            if (typeof nodeData === "undefined") {
                return;
            }
            this.nodeData = nodeData;
            this.hoodData = this.dbKanji.words.map((word) => {
                return {
                    id: WordNode.makeId("Word", word.word),
                    text: word.word,
                };
            });
        }
        get dbKanji() {
            return this.nodeData;
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
        get JLPT() {
            return this.nodeData.JLPT;
        }
        get hint() {
            return this.nodeData.english;
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
    }
    __decorate([
        class_transformer_1.Type(() => KNApi.DbKanji)
    ], KanjiNode.prototype, "nodeData", void 0);
    exports.KanjiNode = KanjiNode;
    // just the opposite of what they recommend in
    // https://stackoverflow.com/questions/42634116/factory-returning-classes-in-typescript
    function nodeFactory(type, dbData) {
        if (type === "Word") {
            return new WordNode(class_transformer_1.plainToClass(KNApi.DbWord, dbData, { ignoreDecorators: true }));
        }
        if (type === "Kanji") {
            return new KanjiNode(class_transformer_1.plainToClass(KNApi.DbKanji, dbData, { ignoreDecorators: true }));
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