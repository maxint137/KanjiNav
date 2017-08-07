import {
    Edge,
    INode,
} from "./knModel";

export interface IPersistentStorage {
    serialize(o: string);
    deserialize(): string;
}

export interface ISnapshotDB {

    serialize(ps: IPersistentStorage): void;
    deserialize(ps: IPersistentStorage): void;

    saveSnapshot(ss: Snapshot): void;
    loadSnapshot(id: string): Snapshot;
}

export class Snapshot {

    public nodes: NodeDescriptor[];
    public edges: EdgeDescriptor[];

    constructor(public id: string) {
        this.nodes = [];
        this.edges = [];
    }
}

export class NodeDescriptor {

    constructor(public name: string, public x: number, public y: number, public node: INode) { }

}

export class EdgeDescriptor {

    constructor(public name: string, public edge: Edge) { }
}
