import * as $ from 'jquery'

import {JLPTDictionary, NodeType, ApiNode} from './kanjiNavBase'

module kanjiNav {
    interface Map<T> {
        [key: string]: T;
    }

    export class Node {

        cast: Array<ApiNode>;
        JLPT: number;
        english: string[];
        hiragana: string;
        onyomi: string[];
        kunyomi: string[];
        
        degree: number = 0;
        constructor(public type: NodeType, public id: string) {
        }

        name(): string { return this.type + this.id; }

        isKanji(): boolean {
            return this.type == NodeType.Char
        }

        copyData(data: any): Node {
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
        }
    }

    export class Edge {
        constructor(public source: string, public target: string) { }
        toString(): string {
            return this.source + '-' + this.target;
        }

        // edge is always towards the actor/char
        static makeEdge(type: NodeType, thisName: string, otherName: string): Edge {
            return type === NodeType.Word ? new Edge(thisName, otherName) : new Edge(otherName, thisName);
        }
    }
    
    export class Graph {
        // maps string to a Node
        nodes: Map<Node> = {};

        // maps string to an edge
        edges: Map<Edge> = {};

        constructor(public db: JLPTDictionary, public jlptFilter: string) {
        }

        reset() {
            this.nodes = {};
            this.edges = {};
        }

        getNode(type: NodeType, id: string, f?: (v: Node) => void, parent?: Node): JQueryPromise<Node> {

            var d = $.Deferred<Node>();
            var name: string = type + id.toString();
            if (name in this.nodes) {
                d.resolve(this.nodes[name]);
                return d.promise();
            }

            let node: Node = this.addNode(type, id);
            if (parent && 0 != parent.cast.filter((c: any) => c[type.id] == id).length) {
                node.copyData(parent.cast.filter((c: any) => c[type.id] == id)[0]);
            }

            var cast = this.db.lookup(type, id, this.jlptFilter);
            $.when(cast).then(c => {
                node.copyData(c);

                f === undefined || f(node);

                (node.cast = c[type.castSel]).forEach((v: any) => {

                    // UF: the server will make sure not to return null for unregistered kanji
                    if (null == v) {
                        return;
                    }

                    try {

                        var neighborName: string = type.next() + v[type.next().id];
                        if (neighborName in this.nodes) {
                            this.addEdge(node, this.nodes[neighborName]);
                        }
                    } catch (error) {
                        debugger;
                    }

                });
                d.resolve(node);
            });
            return d.promise();
        }

        expandNeighbors(node: Node, f: (v: Node) => void): JQueryPromise<Node[]> {

            if (node.cast.filter(c => !c).length) {
                debugger;
                console.log("Nulls for " + node.id);
            }

            // fetch the nodes listed in the cast, bridge edges to these, and call back the client (so it can addViewNode)
            var dn = node.cast
                //.filter(c => null != c)
                .map((c: any) => this.getNode(node.type.next(), c[node.type.next().id], v => {
                    //v.label = c[v.type.label];
                    this.addEdge(node, v);
                    f(v);
                }, node));

            var d = $.Deferred<Node[]>();
            $.when.apply($, dn)
                .then(function () {
                    var neighbors = Array.prototype.slice.call(arguments);
                    d.resolve(neighbors);
                });
            return d.promise();
        }

        fullyExpanded(node: Node): boolean {

            if (node.cast && 0 < node.cast.filter(v => !v).length) {
                console.log("Nulls for " + node.id);
            }

            return node.cast && node.cast
                .filter(v => null != v)
                .every((v: any) => (node.type.next() + v[node.type.next().id]) in this.nodes);
        }

        addNode(type: NodeType, id: string): Node {
            var node = new Node(type, id);
            return this.nodes[node.name()] = node;
        }

        addEdge(u: Node, v: Node) {
            var edge = Edge.makeEdge(u.type, u.name(), v.name());
            var edgeName = edge.toString();
            if (!(edgeName in this.edges)) {
                this.edges[edgeName] = edge;
            }
            ++u.degree, ++v.degree;
        }
    }
}
// https://www.typescriptlang.org/docs/handbook/modules.html
// otherwise require.js will not find it...
export = kanjiNav;

