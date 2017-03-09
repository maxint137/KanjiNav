define(["require", "exports", "jquery"], function (require, exports, $) {
    "use strict";
    var kanjiNav;
    (function (kanjiNav) {
        var NodeType = (function () {
            function NodeType(type, id, // the name of the ID field
                castSel) {
                this.type = type;
                this.id = id;
                this.castSel = castSel;
            }
            NodeType.prototype.toString = function () {
                return this.type;
            };
            NodeType.prototype.next = function () {
                return this === kanjiNav.Word ? kanjiNav.Char : kanjiNav.Word;
            };
            // edge is always towards the actor/char
            NodeType.prototype.makeEdge = function (thisName, otherName) {
                return this === kanjiNav.Word ? new Edge(thisName, otherName) : new Edge(otherName, thisName);
            };
            return NodeType;
        }());
        kanjiNav.NodeType = NodeType;
        kanjiNav.Word = new NodeType("word", "word", 'kanjis');
        kanjiNav.Char = new NodeType("kanji", "character", 'words');
        var ApiNode = (function () {
            function ApiNode() {
            }
            return ApiNode;
        }());
        ;
        var Node = (function () {
            function Node(type, id) {
                this.type = type;
                this.id = id;
                this.degree = 0;
                this.hidden = false;
            }
            Node.prototype.name = function () { return this.type + this.id; };
            Node.prototype.isKanji = function () {
                return this.type == kanjiNav.Char;
            };
            Node.prototype.copyData = function (data) {
                if (data == null) {
                    return;
                }
                this.jlpt = data.JLPT;
                this.english = data.english;
                this.hiragana = data.hiragana;
                this.onyomi = data.onyomi;
                this.kunyomi = data.kunyomi;
                if (this.type.castSel in data) {
                    this.cast = data[this.type.castSel];
                }
                return this;
            };
            return Node;
        }());
        kanjiNav.Node = Node;
        var Graph = (function () {
            function Graph(jlptFilter) {
                this.jlptFilter = jlptFilter;
                this.nodes = {};
                this.edges = {};
            }
            Graph.prototype.reset = function () {
                this.nodes = {};
                this.edges = {};
            };
            Graph.prototype.getNode = function (type, id, f, parent) {
                var _this = this;
                var d = $.Deferred();
                var name = type + id.toString();
                if (name in this.nodes) {
                    return this.nodes[name];
                }
                var node = this.addNode(type, id);
                if (parent && 0 != parent.cast.filter(function (c) { return c[type.id] == id; }).length) {
                    node.copyData(parent.cast.filter(function (c) { return c[type.id] == id; })[0]);
                }
                f === undefined || f(node);
                var cast = request(type, id, this.jlptFilter);
                $.when(cast).then(function (c) {
                    node.copyData(c);
                    (node.cast = c[type.castSel]).forEach(function (v) {
                        // UF: the server will make sure not to return null for unregistered kanji
                        if (null == v) {
                            return;
                        }
                        try {
                            var neighbourname = type.next() + v[type.next().id];
                            if (neighbourname in _this.nodes) {
                                _this.addEdge(node, _this.nodes[neighbourname]);
                            }
                        }
                        catch (error) {
                            debugger;
                        }
                    });
                    d.resolve(node);
                });
                return d.promise();
            };
            Graph.prototype.expandNeighbours = function (node, f) {
                var _this = this;
                if (node.cast.filter(function (c) { return !c; }).length) {
                    debugger;
                    console.log("Nulls for " + node.id);
                }
                // fetch the nodes listed in the cast, bridge edges to these, and call back the client (so it can addViewNode)
                var dn = node.cast
                    .map(function (c) { return _this.getNode(node.type.next(), c[node.type.next().id], function (v) {
                    //v.label = c[v.type.label];
                    _this.addEdge(node, v);
                    f(v);
                }, node); });
                var d = $.Deferred();
                $.when.apply($, dn)
                    .then(function () {
                    var neighbours = Array.prototype.slice.call(arguments);
                    d.resolve(neighbours);
                });
                return d.promise();
            };
            Graph.prototype.fullyExpanded = function (node) {
                var _this = this;
                if (node.cast && 0 < node.cast.filter(function (v) { return !v; }).length) {
                    console.log("Nulls for " + node.id);
                }
                return node.cast && node.cast
                    .filter(function (v) { return null != v; })
                    .every(function (v) { return (node.type.next() + v[node.type.next().id]) in _this.nodes; });
            };
            Graph.prototype.addNode = function (type, id) {
                var node = new Node(type, id);
                return this.nodes[node.name()] = node;
            };
            Graph.prototype.addEdge = function (u, v) {
                var edge = u.type.makeEdge(u.name(), v.name());
                var ename = edge.toString();
                if (!(ename in this.edges)) {
                    this.edges[ename] = edge;
                }
                ++u.degree, ++v.degree;
            };
            return Graph;
        }());
        kanjiNav.Graph = Graph;
        var Edge = (function () {
            function Edge(source, target) {
                this.source = source;
                this.target = target;
            }
            Edge.prototype.toString = function () {
                return this.source + '-' + this.target;
            };
            return Edge;
        }());
        kanjiNav.Edge = Edge;
        function loadKanji(word) {
            return kanjis.filter(function (k) { return 0 <= word.indexOf(k.character); })
                .map(function (k) {
                var kwords = k.words.map(function (kw) { return words.filter(function (w) { return w["_id"]["$oid"] == kw["$oid"]; })[0]; });
                return {
                    __v: 1,
                    JLPT: parseInt(k.JLPT),
                    character: k.character,
                    _id: "58883418e46ff154dc7-" + k["_id"]["$oid"],
                    words: kwords
                };
            });
        }
        function request(type, id, jlptFilter) {
            var d = $.Deferred();
            // http://localhost:3000/api/v1/word/食品
            // http://localhost:3000/api/v1/kanji/品
            // var query = "/api/v1/" + type.type + "/" + id + (jlptFilter ? '?JLPT=' + jlptFilter : '');
            // return $.get(query);
            var defer = $.Deferred();
            if (type.type == kanjiNav.Word.type) {
                var word = words.filter(function (w) { return w.word == id; })[0];
                if (word) {
                    var wordApiRes_1 = {
                        _id: "5882353f4df6c031640-" + word["_id"]["$oid"],
                        word: word.word,
                        hiragana: word.hiragana,
                        JLPT: parseInt(word.JLPT),
                        english: word.english,
                        kanjis: loadKanji(word.word),
                    };
                    setTimeout(function () { return defer.resolve(wordApiRes_1); }, 1);
                }
            }
            else if (type.type == kanjiNav.Char.type) {
                var kanji = kanjis.filter(function (k) { return k.character == id; })[0];
                var kanjiApiRes_1 = {
                    _id: "58883418e46ff154dc7-" + kanji["_id"]["$oid"],
                    character: kanji.character,
                    JLPT: parseInt(kanji.JLPT),
                    words: loadKanji(id)[0].words,
                    english: kanji.english,
                    kunyomi: kanji.kunyomi,
                    onyomi: kanji.onyomi
                };
                setTimeout(function () { return defer.resolve(kanjiApiRes_1); }, 1);
            }
            else {
                debugger;
            }
            return defer;
        }
    })(kanjiNav || (kanjiNav = {}));
    return kanjiNav;
});
//# sourceMappingURL=kanjiNav.js.map