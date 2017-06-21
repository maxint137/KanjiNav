/// <reference path="../node_modules/@types/jquery/index.d.ts" />
/// <reference path="knApi.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function opposite(tp) {
        return tp == 'Word' ? 'Kanji' : 'Word';
    }
    var BaseNode = (function () {
        function BaseNode(dictEntry) {
            this.dictEntry = dictEntry;
        }
        Object.defineProperty(BaseNode.prototype, "JLPT", {
            get: function () {
                return this.dictEntry.JLPT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseNode.prototype, "isKanji", {
            get: function () {
                return this.type == "Kanji";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseNode.prototype, "id", {
            get: function () {
                return this.type + "_" + this.text;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseNode.prototype, "title", {
            get: function () {
                throw new Error("Base class implementation was called.");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseNode.prototype, "subscript", {
            get: function () {
                throw new Error("Base class implementation was called.");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseNode.prototype, "superscript", {
            get: function () {
                throw new Error("Base class implementation was called.");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseNode.prototype, "hint", {
            get: function () {
                throw new Error("Base class implementation was called.");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseNode.prototype, "hood", {
            get: function () {
                throw new Error("Base class implementation was called.");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseNode.prototype, "text", {
            get: function () {
                throw new Error("Base class implementation was called.");
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BaseNode.prototype, "type", {
            get: function () {
                throw new Error("Base class implementation was called.");
            },
            enumerable: true,
            configurable: true
        });
        return BaseNode;
    }());
    var WordNode = (function (_super) {
        __extends(WordNode, _super);
        function WordNode(dbWord) {
            var _this = _super.call(this, dbWord) || this;
            _this.dbWord = dbWord;
            return _this;
        }
        Object.defineProperty(WordNode.prototype, "text", {
            get: function () {
                return this.dbWord.word;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WordNode.prototype, "type", {
            get: function () {
                return "Word";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WordNode.prototype, "title", {
            get: function () {
                return [this.dbWord.word];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WordNode.prototype, "subscript", {
            get: function () {
                return [this.dbWord.english[0] + (1 < this.dbWord.english.length ? "..." : "")];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WordNode.prototype, "superscript", {
            get: function () {
                return [this.dbWord.hiragana];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WordNode.prototype, "hint", {
            get: function () {
                return this.dbWord.english;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(WordNode.prototype, "hood", {
            get: function () {
                return this.dbWord.kanjis.map(function (data) { return nodeFactory("Kanji", data); });
            },
            enumerable: true,
            configurable: true
        });
        return WordNode;
    }(BaseNode));
    exports.WordNode = WordNode;
    var KanjiNode = (function (_super) {
        __extends(KanjiNode, _super);
        function KanjiNode(dbKanji) {
            var _this = _super.call(this, dbKanji) || this;
            _this.dbKanji = dbKanji;
            return _this;
        }
        Object.defineProperty(KanjiNode.prototype, "text", {
            get: function () {
                return this.dbKanji.character;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(KanjiNode.prototype, "type", {
            get: function () {
                return "Kanji";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(KanjiNode.prototype, "title", {
            get: function () {
                return [this.dbKanji.character];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(KanjiNode.prototype, "subscript", {
            get: function () {
                return [this.dbKanji.onyomi[0]];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(KanjiNode.prototype, "superscript", {
            get: function () {
                return [this.dbKanji.kunyomi[0]];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(KanjiNode.prototype, "hint", {
            get: function () {
                return this.dbKanji.english;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(KanjiNode.prototype, "hood", {
            get: function () {
                return this.dbKanji.words.map(function (data) { return nodeFactory("Word", data); });
            },
            enumerable: true,
            configurable: true
        });
        return KanjiNode;
    }(BaseNode));
    exports.KanjiNode = KanjiNode;
    // just the opposite of what they recommend in https://stackoverflow.com/questions/42634116/factory-returning-classes-in-typescript
    function nodeFactory(type, dbData) {
        if (type == "Word") {
            return new WordNode(dbData);
        }
        if (type == "Kanji") {
            return new KanjiNode(dbData);
        }
        throw new Error("Unexpected node type: " + type);
    }
    exports.nodeFactory = nodeFactory;
    var Edge = (function () {
        function Edge(source, target) {
            this.source = source;
            this.target = target;
        }
        Edge.prototype.toString = function () {
            return this.source + "-" + this.target;
        };
        // edge is always towards the actor/char
        Edge.makeEdge = function (type, thisName, otherName) {
            //return type == NodeType.Word ? new Edge(thisName, otherName) : new Edge(otherName, thisName);
            return type == "Word" ? new Edge(thisName, otherName) : new Edge(otherName, thisName);
        };
        return Edge;
    }());
    exports.Edge = Edge;
    var Graph = (function () {
        function Graph(db, jlptFilter) {
            this.db = db;
            this.jlptFilter = jlptFilter;
            // maps string to a Node
            this.nodes = {};
            // maps string to an edge
            this.edges = {};
        }
        Graph.prototype.reset = function () {
            this.nodes = {};
            this.edges = {};
        };
        // Returns a promise of having a node (specified by a string and type) fetched from the database.
        // A user callback is invoked if supplied.
        Graph.prototype.loadNode = function (type, text, userCallback, parent) {
            var _this = this;
            var result = $.Deferred();
            var name = type + text.toString();
            if (name in this.nodes) {
                // we have this word cached
                result.resolve(this.nodes[name]);
                return result.promise();
            }
            // query the database
            var hood = type == "Kanji" ? this.db.lookupKanji(text) : this.db.lookupWord(text);
            $.when(hood).then(function (c) {
                var nNode = nodeFactory(type, c);
                _this.nodes[nNode.id] = nNode;
                (nNode.hood).forEach(function (v) {
                    // UF: the server will make sure not to return null for unregistered kanji
                    if (null == v) {
                        console.assert(false, "Server bad response: null in the hood");
                    }
                    try {
                        var neighborName = v.id; //opposite(type) + v[type.next().id];
                        if (neighborName in _this.nodes) {
                            _this.addEdge(nNode, _this.nodes[neighborName]);
                        }
                    }
                    catch (error) {
                        console.assert(false, error);
                    }
                });
                // call back the user
                userCallback === undefined || userCallback(nNode);
                // finished
                result.resolve(nNode);
            });
            return result.promise();
        };
        // Returns a promise of having all the neighbor nodes of a given parent node fetched from the database.
        // For each loaded node adds an edge connecting it to the parent node.
        Graph.prototype.expandNeighbors = function (parentNode, f) {
            var _this = this;
            console.assert(0 === parentNode.hood.filter(function (h) { return !h; }).length, "Nulls in the hood for '" + parentNode.id + "'");
            if (0 === parentNode.hood.length) {
                var d_1 = $.Deferred();
                d_1.resolveWith([]);
                return d_1.promise();
            }
            // fetch the nodes listed in the hood, bridge edges to these, and call back the client (so it can addViewNode)
            var hoodLoaded = parentNode.hood
                .map(function (h) {
                return _this.loadNode(opposite(parentNode.type), h.text, function (v) {
                    _this.addEdge(parentNode, v);
                    f(v);
                }, parentNode);
            });
            var d = $.Deferred();
            $.when.apply($, hoodLoaded)
                .then(function () {
                var neighbors = Array.prototype.slice.call(arguments);
                d.resolve(neighbors);
            });
            return d.promise();
        };
        Graph.prototype.isFullyExpanded = function (node) {
            var _this = this;
            if (node.hood && 0 < node.hood.filter(function (v) { return !v; }).length) {
                console.log("Nulls for " + node.id);
            }
            return node.hood && node.hood
                .filter(function (v) { return null != v; })
                .every(function (v) { return v.id in _this.nodes; });
        };
        Graph.prototype.addEdge = function (u, v) {
            var edge = Edge.makeEdge(u.type, u.id, v.id);
            var eName = edge.toString();
            if (!(eName in this.edges)) {
                this.edges[eName] = edge;
            }
            ++u.degree, ++v.degree;
        };
        return Graph;
    }());
    exports.Graph = Graph;
});
//# sourceMappingURL=knModel.js.map