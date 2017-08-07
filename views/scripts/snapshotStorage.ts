import "reflect-metadata";
import * as _ from "underscore";

import { classToClass, deserializeArray, Exclude, serialize, Type } from "class-transformer";
//import { classToClass, deserializeArray, serialize, Type } from "./../node_modules/class-transformer/index";

import * as Storage from "./IStorage";

import {
    Edge,
    INode,
    KanjiNode,
    WordNode,
} from "./knModel";

// here we separate the nodes into the "clearly typed" arrays
// so that de/serialization is possible
class SnapshotDistilled {
    public id: string;

    @Type(() => WordNodeEx)
    public wordNodes: WordNodeEx[];

    @Type(() => KanjiNodeEx)
    public kanjiNodes: KanjiNodeEx[];

    @Type(() => Edge)
    public edges: Storage.EdgeDescriptor[];

    public constructor(ss: Storage.Snapshot) {
        if (!ss) {
            return;
        }

        this.id = ss.id;

        this.wordNodes = [];
        this.kanjiNodes = [];

        ss.nodes.forEach((ln) => {

            if (ln.node.isKanji) {
                this.kanjiNodes.push(new KanjiNodeEx(ln))
            } else {
                this.wordNodes.push(new WordNodeEx(ln))
            }
        })

        this.edges = classToClass(ss.edges);
    }
}

class NameLocation {
    constructor(public name: string, public x: number, public y: number) { }
}
class WordNodeEx extends NameLocation {

    public name: string;

    @Type(() => WordNode)
    public node: WordNode;

    constructor(wd: Storage.NodeDescriptor) {
        if (!wd) {
            super(null, 0, 0);
            return;
        }

        super(wd.name, wd.x, wd.y);

        if (wd.node.isKanji) {
            throw new Error("Wrong INode type passed");
        }

        this.x = wd.x;
        this.y = wd.y;
        this.node = classToClass(wd.node) as WordNode;
    }
}

class KanjiNodeEx extends NameLocation {

    @Type(() => KanjiNode)
    public node: KanjiNode;

    constructor(nd: Storage.NodeDescriptor) {
        if (!nd) {
            super(null, 0, 0);
            return;
        }

        super(nd.name, nd.x, nd.y);

        if (!nd.node.isKanji) {
            throw new Error("Wrong INode type passed");
        }

        this.node = nd.node as KanjiNode;
    }
}

export class SnapshotDB implements Storage.ISnapshotDB {

    @Type(() => SnapshotDistilled)
    private snapshots: SnapshotDistilled[];

    public constructor() {
        this.snapshots = [];
    }

    public serialize(ps: Storage.IPersistentStorage): void {

        ps.serialize(serialize(this.snapshots))
        return;
    }

    public deserialize(ps: Storage.IPersistentStorage): void {

        const s: string = ps.deserialize();
        if (!s) {
            return;
        }

        this.snapshots = deserializeArray(SnapshotDistilled, s);
        return;
    }

    public saveSnapshot(ss: Storage.Snapshot): void {
        // update or create?
        const index: number = this.findSnapshot(ss.id);

        if (index < 0) {
            this.createSnapshot(ss);
        } else {
            this.updateSnapshot(ss.id, ss);
        }
    }

    public loadSnapshot(id: string): Storage.Snapshot {
        const index: number = this.findSnapshot(id);
        if (index < 0) {
            return null;
        }

        const sd: SnapshotDistilled = this.snapshots[index];

        const ss: Storage.Snapshot = new Storage.Snapshot(sd.id);

        sd.wordNodes.forEach((wn) => {
            ss.nodes.push(new Storage.NodeDescriptor(wn.name, wn.x, wn.y, classToClass(wn.node)));
        });

        sd.kanjiNodes.forEach((kn) => {
            ss.nodes.push(new Storage.NodeDescriptor(kn.name, kn.x, kn.y, classToClass(kn.node)));
        });

        ss.edges = classToClass(sd.edges)

        return ss;
    }

    private findSnapshot(id: string): number {
        return _.findIndex(this.snapshots, (ss) => ss.id === id);
    }

    private deleteSnapshot(id: string): void {
        this.snapshots.splice(this.findSnapshot(id), 1);
    }

    private updateSnapshot(id: string, ss: Storage.Snapshot): void {
        this.deleteSnapshot(id);
        this.createSnapshot(ss);
    }

    private createSnapshot(ss: Storage.Snapshot): void {

        this.snapshots.push(classToClass(new SnapshotDistilled(ss)));
    }
}
