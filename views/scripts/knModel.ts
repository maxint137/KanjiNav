// import "./node_modules/@types/jquery/index";

import * as KNApi from "./knApi";

interface IMap<T> {
    [key: string]: T;
}

export type NodeTypes = "Word" | "Kanji";
function opposite(tp: NodeTypes): NodeTypes {
    return tp === "Word" ? "Kanji" : "Word";
}

export interface INode {
    // the text
    text: string;
    // the type
    type: NodeTypes;
    // the ID: text-type
    id: string;

    title: string[];
    subscript: string[];
    superscript: string[];
    hint: string[];
    JLPT: KNApi.JlptLevel;

    isKanji: boolean;

    hood: INode[];
    degree: number;
}

class BaseNode implements INode {

    public degree: number;
    constructor(public dictEntry: KNApi.DictEntry) {
    }

    get JLPT(): KNApi.JlptLevel {
        return this.dictEntry.JLPT;
    }

    get isKanji(): boolean {
        return this.type === "Kanji";
    }

    get id(): string {
        return `${this.type}_${this.text}`;
    }

    get title(): string[] {
        throw new Error("Base class implementation was called.");
    }
    get subscript(): string[] {
        throw new Error("Base class implementation was called.");
    }
    get superscript(): string[] {
        throw new Error("Base class implementation was called.");
    }
    get hint(): string[] {
        throw new Error("Base class implementation was called.");
    }
    get hood(): INode[] {
        throw new Error("Base class implementation was called.");
    }
    get text(): string {
        throw new Error("Base class implementation was called.");
    }
    get type(): NodeTypes {
        throw new Error("Base class implementation was called.");
    }
}

export class WordNode extends BaseNode implements INode {

    get text(): string {
        return this.dbWord.word;
    }
    get type(): NodeTypes {
        return "Word";
    }

    constructor(public dbWord: KNApi.DbWord) {
        super(dbWord);
    }

    get title(): string[] {
        return [this.dbWord.word];
    }
    get subscript(): string[] {
        return [this.dbWord.english[0] + (1 < this.dbWord.english.length ? "..." : "")];
    }
    get superscript(): string[] {
        return [this.dbWord.hiragana];
    }
    get hint(): string[] {
        return this.dbWord.english;
    }
    get hood(): INode[] {
        return this.dbWord.kanjis.map((data: KNApi.DbKanji & KNApi.DbWord) => nodeFactory("Kanji", data));
    }
}

export class KanjiNode extends BaseNode implements INode {

    get text(): string {
        return this.dbKanji.character;
    }
    get type(): NodeTypes {
        return "Kanji";
    }

    constructor(public dbKanji: KNApi.DbKanji) {
        super(dbKanji);
    }

    get title(): string[] {
        return [this.dbKanji.character];
    }
    get subscript(): string[] {
        return [this.dbKanji.onyomi[0]];
    }
    get superscript(): string[] {
        return [this.dbKanji.kunyomi[0]];
    }
    get hint(): string[] {
        return this.dbKanji.english;
    }
    get hood(): INode[] {
        return this.dbKanji.words.map((data: KNApi.DbKanji & KNApi.DbWord) => nodeFactory("Word", data));
    }
}

// just the opposite of what they recommend in
// https://stackoverflow.com/questions/42634116/factory-returning-classes-in-typescript
export function nodeFactory(type: NodeTypes, dbData: KNApi.DbWord & KNApi.DbKanji): INode {

    if (type === "Word") {
        return new WordNode(dbData);
    }
    if (type === "Kanji") {
        return new KanjiNode(dbData);
    }

    throw new Error(`Unexpected node type: ${type}`);
}

export class Edge {
    // edge is always towards the actor/char
    public static makeEdge(type: NodeTypes, thisName: string, otherName: string): Edge {
        // return type == NodeType.Word ? new Edge(thisName, otherName) : new Edge(otherName, thisName);
        return type === "Word" ? new Edge(thisName, otherName) : new Edge(otherName, thisName);
    }

    constructor(public source: string, public target: string) { }

    public toString(): string {
        return `${this.source}-${this.target}`;
    }
}

export class Graph {
    // maps string to a Node
    public nodes: IMap<INode> = {};

    // maps string to an edge
    public edges: IMap<Edge> = {};

    constructor(public db: KNApi.IJapaneseDictionary, public jlptFilter: string) {
    }

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
        const name: string = type + text.toString();
        if (name in this.nodes) {
            // we have this word cached
            result.resolve(this.nodes[name]);
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
