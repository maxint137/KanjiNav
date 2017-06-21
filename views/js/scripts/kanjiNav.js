define(["require", "exports", "jquery", "./kanjiNavBase"], function (require, exports, $, kanjiNavBase_1) {
    "use strict";
    // modules vs namespaces
    // https://stackoverflow.com/questions/30357634/how-do-i-use-namespaces-with-typescript-external-modules
    var kanjiNav;
    (function (kanjiNav) {
        var Node = (function () {
            function Node(type, id) {
                this.type = type;
                this.id = id;
                this.degree = 0;
            }
            Node.prototype.name = function () { return this.type + this.id; };
            Node.prototype.isKanji = function () {
                return this.type == kanjiNavBase_1.NodeType.Char;
            };
            Node.prototype.copyData = function (data) {
                if (data == null) {
                    return;
                }
                this.JLPT = data.JLPT;
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
        var Edge = (function () {
            function Edge(source, target) {
                this.source = source;
                this.target = target;
            }
            Edge.prototype.toString = function () {
                return this.source + '-' + this.target;
            };
            // edge is always towards the actor/char
            Edge.makeEdge = function (type, thisName, otherName) {
                return type === kanjiNavBase_1.NodeType.Word ? new Edge(thisName, otherName) : new Edge(otherName, thisName);
            };
            return Edge;
        }());
        kanjiNav.Edge = Edge;
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
            Graph.prototype.getNode = function (type, id, f, parent) {
                var _this = this;
                var d = $.Deferred();
                var name = type + id.toString();
                if (name in this.nodes) {
                    d.resolve(this.nodes[name]);
                    return d.promise();
                }
                var node = this.addNode(type, id);
                if (parent && 0 != parent.cast.filter(function (c) { return c[type.id] == id; }).length) {
                    node.copyData(parent.cast.filter(function (c) { return c[type.id] == id; })[0]);
                }
                var cast = this.db.lookup(type, id, this.jlptFilter);
                $.when(cast).then(function (c) {
                    node.copyData(c);
                    f === undefined || f(node);
                    (node.cast = c[type.castSel]).forEach(function (v) {
                        // UF: the server will make sure not to return null for unregistered kanji
                        if (null == v) {
                            return;
                        }
                        try {
                            var neighborName = type.next() + v[type.next().id];
                            if (neighborName in _this.nodes) {
                                _this.addEdge(node, _this.nodes[neighborName]);
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
            Graph.prototype.expandNeighbors = function (node, f) {
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
                    var neighbors = Array.prototype.slice.call(arguments);
                    d.resolve(neighbors);
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
                var edge = Edge.makeEdge(u.type, u.name(), v.name());
                var edgeName = edge.toString();
                if (!(edgeName in this.edges)) {
                    this.edges[edgeName] = edge;
                }
                ++u.degree, ++v.degree;
            };
            return Graph;
        }());
        kanjiNav.Graph = Graph;
    })(kanjiNav || (kanjiNav = {}));
    return kanjiNav;
});
//# sourceMappingURL=kanjiNav.js.map