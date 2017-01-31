///<reference path="../extern/jquery.d.ts"/>
//module kanjiNav {
module tmdb {

    export class NodeType {
        constructor(
            public type: string,
            public id: string,      // the name of the ID field
        ) { }

        toString(): string {
            return this.type;
        }

        next(): NodeType {
            return this === Movie ? Char : Movie;
        }

        // edge is always towards the actor/char
        makeEdge(thisName: string, otherName: string): Edge {
            return this === Word ? new Edge(thisName, otherName) : new Edge(otherName, thisName);
        }
    }

    export var Word = new NodeType("word", "word");
    export var Movie = new NodeType("word", "word");
    export var Char = new NodeType("char", "character");

    export class Node {
        cast: any[];
        jlpt: number;
        degree: number = 0;
        constructor(public type: NodeType, public id: string) { }
        name(): string { return this.type + this.id; }
        getImage(): JQueryPromise<Node> {
            var d = $.Deferred<Node>();
            d.resolve(this);
            return d.promise();
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
                //node.jlpt = ...
                (node.cast = c['kanjis']).forEach((v) => {
                    var neighbourname: string = type.next() + v.character;
                    if (neighbourname in this.nodes) {
                        this.addEdge(node, this.nodes[neighbourname]);
                    }
                });
                d.resolve(node);
            });
            return d.promise();
        }

        expandNeighbours(node: Node, f: (v: Node) => void): JQueryPromise<Node[]> {
            var dn = node.cast.map(c=> this.getNode(node.type.next(), c[node.type.next().id], v => {
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
            return node.cast && node.cast.every(v=> (node.type.next() + v[node.type.next().id]) in this.nodes);
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

        // http://localhost:3000/api/v1/word/品川
        var query = "http://localhost:3000/api/v1/word/" + id;

        return $.get(query);
    }

}