///<reference path="../extern/jquery.d.ts"/>
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
    var Node = (function () {
        function Node(type, id) {
            this.type = type;
            this.id = id;
            this.degree = 0;
        }
        Node.prototype.name = function () { return this.type + this.id; };
        Node.prototype.getImage = function () {
            var d = $.Deferred();
            d.resolve(this);
            return d.promise();
        };
        Node.prototype.copyData = function (data) {
            this.jlpt = data.JLPT;
            this.english = data.english;
            this.onyomi = data.onyomi;
            this.kunyomi = data.kunyomi;
            return this;
        };
        return Node;
    }());
    kanjiNav.Node = Node;
    var Graph = (function () {
        function Graph() {
            this.nodes = {};
            this.edges = {};
        }
        Graph.prototype.getNode = function (type, id, f) {
            var _this = this;
            console.log("getNode->" + id);
            debugger;
            var d = $.Deferred();
            var name = type + id.toString();
            if (name in this.nodes) {
                return this.nodes[name];
            }
            var node = this.addNode(type, id);
            f === undefined || f(node);
            var cast = request(type, id);
            $.when(cast).then(function (c) {
                node.copyData(c);
                (node.cast = c[type.castSel]).forEach(function (v) {
                    // UF: the server will make sure not to return null for unregistered kanji
                    if (null == v) {
                        return;
                    }
                    var neighbourname = type.next() + v.character;
                    if (neighbourname in _this.nodes) {
                        _this.addEdge(node, _this.nodes[neighbourname]);
                    }
                });
                d.resolve(node);
            });
            return d.promise();
        };
        Graph.prototype.expandNeighbours = function (node, f) {
            var _this = this;
            var dn = node.cast.map(function (c) { return _this.getNode(node.type.next(), c[node.type.next().id], function (v) {
                //v.label = c[v.type.label];
                _this.addEdge(node, v);
                f(v);
            }); });
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
            return node.cast && node.cast.every(function (v) { return (node.type.next() + v[node.type.next().id]) in _this.nodes; });
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
    function request(type, id) {
        var d = $.Deferred();
        // http://localhost:3000/api/v1/word/食品
        // http://localhost:3000/api/v1/kanji/品
        var query = "http://localhost:3000/api/v1/" + type.type + "/" + id;
        return $.get(query);
    }
})(kanjiNav || (kanjiNav = {}));
//# sourceMappingURL=kanjiNav.js.map