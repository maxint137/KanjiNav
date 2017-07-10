// import "./node_modules/@types/jquery/index";
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function opposite(tp) {
        return tp === "Word" ? "Kanji" : "Word";
    }
    class BaseNode {
        constructor(dictEntry) {
            this.dictEntry = dictEntry;
        }
        get JLPT() {
            return this.dictEntry.JLPT;
        }
        get isKanji() {
            return this.type === "Kanji";
        }
        get id() {
            return `${this.type}_${this.text}`;
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
        get hint() {
            throw new Error("Base class implementation was called.");
        }
        get hood() {
            throw new Error("Base class implementation was called.");
        }
        get text() {
            throw new Error("Base class implementation was called.");
        }
        get type() {
            throw new Error("Base class implementation was called.");
        }
    }
    class WordNode extends BaseNode {
        constructor(dbWord) {
            super(dbWord);
            this.dbWord = dbWord;
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
        get hint() {
            return this.dbWord.english;
        }
        get hood() {
            return this.dbWord.kanjis.map((data) => nodeFactory("Kanji", data));
        }
    }
    exports.WordNode = WordNode;
    class KanjiNode extends BaseNode {
        constructor(dbKanji) {
            super(dbKanji);
            this.dbKanji = dbKanji;
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
        get hint() {
            return this.dbKanji.english;
        }
        get hood() {
            return this.dbKanji.words.map((data) => nodeFactory("Word", data));
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
    class Edge {
        constructor(source, target) {
            this.source = source;
            this.target = target;
        }
        // edge is always towards the actor/char
        static makeEdge(type, thisName, otherName) {
            // return type == NodeType.Word ? new Edge(thisName, otherName) : new Edge(otherName, thisName);
            return type === "Word" ? new Edge(thisName, otherName) : new Edge(otherName, thisName);
        }
        toString() {
            return `${this.source}-${this.target}`;
        }
    }
    exports.Edge = Edge;
    class Graph {
        constructor(db, jlptFilter) {
            this.db = db;
            this.jlptFilter = jlptFilter;
            // maps string to a Node
            this.nodes = {};
            // maps string to an edge
            this.edges = {};
        }
        reset() {
            this.nodes = {};
            this.edges = {};
        }
        // Returns a promise of having a node (specified by a string and type) fetched from the database.
        // A user callback is invoked if supplied.
        loadNode(type, text, userCallback, parent) {
            const result = $.Deferred();
            const name = type + text.toString();
            if (name in this.nodes) {
                // we have this word cached
                result.resolve(this.nodes[name]);
                return result.promise();
            }
            // query the database
            const hood = type === "Kanji"
                ? this.db.lookupKanji(text)
                : this.db.lookupWord(text);
            hood.then((c) => {
                const nNode = nodeFactory(type, c);
                this.nodes[nNode.id] = nNode;
                (nNode.hood).forEach((v) => {
                    // UF: the server will make sure not to return null for unregistered kanji
                    if (null === v) {
                        console.assert(false, "Server bad response: null in the hood");
                    }
                    try {
                        const neighborName = v.id; // opposite(type) + v[type.next().id];
                        if (neighborName in this.nodes) {
                            this.addEdge(nNode, this.nodes[neighborName]);
                        }
                    }
                    catch (error) {
                        console.assert(false, error);
                    }
                });
                // call back the user
                if (userCallback !== undefined) {
                    userCallback(nNode);
                }
                // finished
                result.resolve(nNode);
            });
            return result.promise();
        }
        // Returns a promise of having all the neighbor nodes of a given parent node fetched from the database.
        // For each loaded node adds an edge connecting it to the parent node.
        expandNeighbors(parentNode, f) {
            console.assert(0 === parentNode.hood.filter((h) => !h).length, `Nulls in the hood for "${parentNode.id}"`);
            if (0 === parentNode.hood.length) {
                const d = $.Deferred();
                d.resolveWith([]);
                return d.promise();
            }
            // fetch the nodes listed in the hood, bridge edges to these, and call back the client (so it can addViewNode)
            const hoodLoaded = parentNode.hood
                .map((h) => this.loadNode(opposite(parentNode.type), h.text, (v) => {
                this.addEdge(parentNode, v);
                f(v);
            }, parentNode));
            const d = $.Deferred();
            $.when.apply($, hoodLoaded)
                .then((args) => {
                const neighbors = Array.prototype.slice.call(args);
                d.resolve(neighbors);
            });
            return d.promise();
        }
        isFullyExpanded(node) {
            if (node.hood && 0 < node.hood.filter((v) => !v).length) {
                console.log(`Nulls for ${node.id}`);
            }
            return node.hood && node.hood
                .filter((v) => null !== v)
                .every((v) => v.id in this.nodes);
        }
        addEdge(u, v) {
            const edge = Edge.makeEdge(u.type, u.id, v.id);
            const eName = edge.toString();
            if (!(eName in this.edges)) {
                this.edges[eName] = edge;
            }
            ++u.degree;
            ++v.degree;
        }
    }
    exports.Graph = Graph;
});
//# sourceMappingURL=knModel.js.map