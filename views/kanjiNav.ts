///<reference path="../extern/jquery.d.ts"/>
module kanjiNav {
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
            return this === Word ? Char : Word;
        }

        // edge is always towards the actor/char
        makeEdge(thisName: string, otherName: string): Edge {
            return this === Word ? new Edge(thisName, otherName) : new Edge(otherName, thisName);
        }
    }

    export var Word = new NodeType("word", "word", 'kanjis');
    export var Char = new NodeType("kanji", "character", 'words');

    export class Node {
        cast: any[];
        jlpt: number;
        english: string[];
        onyomi: string[];
        kunyomi: string[];

        degree: number = 0;
        constructor(public type: NodeType, public id: string) { }
        name(): string { return this.type + this.id; }
        getImage(): JQueryPromise<Node> {
            var d = $.Deferred<Node>();
            d.resolve(this);
            return d.promise();
        }

        copyData(data: any): Node {
            this.jlpt = data.JLPT;
            this.english = data.english;
            this.onyomi = data.onyomi;
            this.kunyomi = data.kunyomi;

            return this;
        }
    }

    export class Graph {
        nodes: any = {};
        edges: any = {};

        getNode(type: NodeType, id: string, f: (v: Node) => void): JQueryPromise<Node> {

            var d = $.Deferred<Node>();
            var name: string = type + id.toString();
            if (name in this.nodes) {
                return this.nodes[name];
            }
            var node = this.addNode(type, id);

            f === undefined || f(node);

            var cast = request(type, id);
            $.when(cast).then(c => {
                node.copyData(c);

                (node.cast = c[type.castSel]).forEach((v) => {

                    // UF: the server will make sure not to return null for unregistered kanji
                    if (null == v) {
                        return;
                    }

                    try {

                        var neighbourname: string = type.next() + v.character;
                        if (neighbourname in this.nodes) {
                            this.addEdge(node, this.nodes[neighbourname]);
                        }
                    } catch (error) {
                        debugger;
                    }

                });
                d.resolve(node);
            });
            return d.promise();
        }

        expandNeighbours(node: Node, f: (v: Node) => void): JQueryPromise<Node[]> {

            if (node.cast.filter(c => !c).length) {
                console.log("Nulls for " + node.id);
            }

            var dn = node.cast
                        .filter(c => null != c)
                        .map(c => this.getNode(node.type.next(), c[node.type.next().id], v => {
                //v.label = c[v.type.label];
                this.addEdge(node, v);
                f(v);
            }));
            var d = $.Deferred<Node[]>();
            $.when.apply($, dn)
                .then(function () {
                    var neighbours = Array.prototype.slice.call(arguments);
                    d.resolve(neighbours);
                });
            return d.promise();
        }

        fullyExpanded(node: Node): boolean {

            if (node.cast && 0 < node.cast.filter(v => !v).length) {
                console.log("Nulls for " + node.id);
            }

            return node.cast && node.cast
                .filter(v => null != v)
                .every(v => (node.type.next() + v[node.type.next().id]) in this.nodes);
        }

        addNode(type: NodeType, id: string): Node {
            var node = new Node(type, id);
            return this.nodes[node.name()] = node;
        }

        addEdge(u: Node, v: Node) {
            var edge = u.type.makeEdge(u.name(), v.name());
            var ename = edge.toString();
            if (!(ename in this.edges)) {
                this.edges[ename] = edge;
            }
            ++u.degree, ++v.degree;
        }
    }

    export class Edge {
        constructor(public source: string, public target: string) { }
        toString(): string {
            return this.source + '-' + this.target;
        }
    }

    function request(type: NodeType, id: string): JQueryPromise<any> {

        var d = $.Deferred<any>();

        // http://localhost:3000/api/v1/word/食品
        // http://localhost:3000/api/v1/kanji/品
        var query = "http://localhost:3000/api/v1/" + type.type + "/" + id;

        return $.get(query);
    }
}