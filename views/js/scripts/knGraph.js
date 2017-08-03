// tslint:disable:member-access
// tslint:disable:object-literal-key-quotes
// tslint:disable:object-literal-sort-keys
// tslint:disable:label-position
// tslint:disable:no-unused-expression
define(["require", "exports", "./graphStorage", "./knModel"], function (require, exports, graphStorage_1, knModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Graph {
        constructor(db, jlptFilter, storage) {
            this.db = db;
            this.jlptFilter = jlptFilter;
            // maps string to a Node
            this.nodes = {};
            // maps string to an edge
            this.edges = {};
            this.ts = storage || new graphStorage_1.GraphStorage();
        }
        save(saveId) {
            this.ts.saveMaps(saveId, { nodes: this.nodes, edges: this.edges });
        }
        load(saveId) {
            this.reset();
            this.ts.loadMaps(saveId, { nodes: this.nodes, edges: this.edges });
        }
        reset() {
            this.nodes = {};
            this.edges = {};
        }
        // Returns a promise of having a node (specified by a string and type) fetched from the database.
        // A user callback is invoked if supplied.
        loadNode(type, text, userCallback, parent) {
            const result = $.Deferred();
            const nodeId = knModel_1.BaseNode.makeId(type, text);
            if (nodeId in this.nodes) {
                // we have this word cached
                result.resolve(this.nodes[nodeId]);
                return result.promise();
            }
            // query the database
            const hood = type === "Kanji"
                ? this.db.lookupKanji(text)
                : this.db.lookupWord(text);
            hood.then((c) => {
                const nNode = knModel_1.nodeFactory(type, c);
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
                .map((h) => this.loadNode(knModel_1.opposite(parentNode.type), h.text, (v) => {
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
            const edge = knModel_1.Edge.makeEdge(u.type, u.id, v.id);
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
//# sourceMappingURL=knGraph.js.map