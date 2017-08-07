// tslint:disable:member-access
// tslint:disable:object-literal-key-quotes
// tslint:disable:object-literal-sort-keys
// tslint:disable:label-position
// tslint:disable:no-unused-expression

import { Type } from "../node_modules/class-transformer/index"

import * as KNApi from "./knApi";
import { BaseNode, Edge, INode, nodeFactory, NodeTypes, opposite } from "./knModel";

export class Graph {
    // maps string to a Node
    public nodes: KNApi.IMap<INode> = {};

    // maps string to an edge
    public edges: KNApi.IMap<Edge> = {};

    constructor(public db: KNApi.IJapaneseDictionary, public jlptFilter: string) {
    }

    // public save(saveId: string) {
    //     this.ts.saveMaps(saveId, { nodes: this.nodes, edges: this.edges });
    // }
    // public load(saveId: string) {

    //     this.reset();
    //     this.ts.loadMaps(saveId, { nodes: this.nodes, edges: this.edges });
    // }

    public reset() {
        this.nodes = {};
        this.edges = {};
    }

    // Returns a promise of having a node (specified by a string and type) fetched from the database.
    // A user callback is invoked if supplied.
    public loadNode(type: NodeTypes,
        text: string,
        userCallback?: (v: INode) => void, parent?: INode): JQueryPromise<INode> {

        const result: JQueryDeferred<INode> = $.Deferred<INode>();
        const nodeId: string = BaseNode.makeId(type, text);
        if (nodeId in this.nodes) {
            // we have this word cached
            result.resolve(this.nodes[nodeId]);
            return result.promise();
        }

        // query the database
        const hood: Promise<KNApi.DictEntry> = type === "Kanji"
            ? this.db.lookupKanji(text)
            : this.db.lookupWord(text);

        hood.then((c: KNApi.DbWord & KNApi.DbKanji) => {

            const nNode: INode = nodeFactory(type, c);

            this.nodes[nNode.id] = nNode;

            (nNode.hood).forEach((v: INode) => {
                // UF: the server will make sure not to return null for unregistered kanji
                if (null === v) {
                    console.assert(false, "Server bad response: null in the hood");
                }

                try {
                    const neighborName: string = v.id; // opposite(type) + v[type.next().id];
                    if (neighborName in this.nodes) {
                        this.addEdge(nNode, this.nodes[neighborName]);
                    }
                } catch (error) {
                    console.assert(false, error);
                }
            });

            // call back the user
            if (typeof userCallback !== "undefined") {
                userCallback(nNode);
            }

            // finished
            result.resolve(nNode);
        });

        return result.promise();
    }

    // Returns a promise of having all the neighbor nodes of a given parent node fetched from the database.
    // For each loaded node adds an edge connecting it to the parent node.
    public expandNeighbors(parentNode: INode, f: (v: INode) => void): JQueryPromise<INode[]> {

        console.assert(0 === parentNode.hood.filter((h) => !h).length, `Nulls in the hood for "${parentNode.id}"`);

        if (0 === parentNode.hood.length) {
            const d: JQueryDeferred<INode[]> = $.Deferred<INode[]>();
            d.resolveWith([]);
            return d.promise();
        }

        // fetch the nodes listed in the hood, bridge edges to these, and call back the client (so it can addViewNode)
        const hoodLoaded: Array<JQueryPromise<INode>> = parentNode.hood
            .map((h) =>
                this.loadNode(
                    opposite(parentNode.type),
                    h.text,
                    (v) => {
                        this.addEdge(parentNode, v);
                        f(v);
                    },
                    parentNode,
                ),
        );

        const d: JQueryDeferred<INode[]> = $.Deferred<INode[]>();

        $.when.apply($, hoodLoaded)
            .then((args: IArguments) => {
                const neighbors: INode[] = Array.prototype.slice.call(args);
                d.resolve(neighbors);
            });

        return d.promise();
    }

    public isFullyExpanded(node: INode): boolean {

        if (node.hood && 0 < node.hood.filter((v) => !v).length) {
            console.log(`Nulls for ${node.id}`);
        }

        return node.hood && node.hood
            .filter((v: INode) => null !== v)
            .every((v: INode) => v.id in this.nodes);
    }

    public addEdge(u: INode, v: INode) {

        const edge: Edge = Edge.makeEdge(u.type, u.id, v.id);
        const eName: string = edge.toString();

        if (!(eName in this.edges)) {
            this.edges[eName] = edge;
        }
        ++u.degree;
        ++v.degree;
    }
}
