// tslint:disable:max-classes-per-file
import { deserializeArray, serialize, Type } from "class-transformer"; //"./../node_modules/class-transformer/index";

import "reflect-metadata";
import * as _ from "underscore";

import { IMap } from "./knApi";
import {
    Edge,
    INeighborID,
    INode,
    KanjiNode,
    NodeTypes,
    WordNode,
} from "./knModel";

interface IGraphMaps {
    nodes: IMap<INode>;
    edges: IMap<Edge>;
}

export interface IGraphStorage {

    saveMaps(id: string, maps: IGraphMaps): void;
    loadMaps(id: string, maps: IGraphMaps): void;
}

export class PositionMap {

    [key: string]: { x: number, y: number };
}

export interface IViewStorage {

    isItemAvailable(id: string): boolean;
    saveNodesPosition(id: string, positions: PositionMap): void;
    loadNodesPosition(id: string, positions: PositionMap): void;
}

class MapElement {

    public constructor(public key: string) { }
};

class NodePosition {
    constructor(public x: number, public y: number) { }
}
class NodePositionWithKey extends MapElement {
    @Type(() => NodePosition)
    public val: NodePosition;
}

class WordNodeWithKey extends MapElement {
    @Type(() => WordNode)
    public val: WordNode;
}

class KanjiNodeWithKey extends MapElement {
    @Type(() => KanjiNode)
    public val: KanjiNode;
}

class EdgeWithKey extends MapElement {
    @Type(() => Edge)
    public val: Edge;
}

export class Storage implements IGraphStorage, IViewStorage {

    private static PositionsId(id: string): string {
        return `${id}-positions`;
    }
    private static wordNodesId(id: string): string {
        return `${id}-wordNodes`;
    }
    private static kanjiNodesId(id: string): string {
        return `${id}-kanjiNodes`;
    }
    private static edgesId(id: string): string {
        return `${id}-edges`;
    }

    private data: { [key: string]: string } = {};

    public isItemAvailable(id: string): boolean {
        return !(typeof this.data[Storage.PositionsId(id)] === "undefined");
    }

    public saveNodesPosition(id: string, positions: PositionMap): void {
        this.data[Storage.PositionsId(id)] = serialize(this.map2array(positions, null));
    }

    public loadNodesPosition(id: string, positions: PositionMap): void {

        this.array2map<NodePosition>(
            NodePositionWithKey,
            this.data[Storage.PositionsId(id)],
            positions);
    }

    public saveMaps(id: string, maps: IGraphMaps): void {

        if (maps.nodes) {
            this.data[Storage.wordNodesId(id)]
                = serialize(this.map2array(maps.nodes, (node) => "Word" === node.type));

            this.data[Storage.kanjiNodesId(id)]
                = serialize(this.map2array(maps.nodes, (node) => "Kanji" === node.type));
        }

        if (maps.edges) {
            this.data[Storage.edgesId(id)]
                = serialize(this.map2array(maps.edges, null));
        }
    }

    public loadMaps(id: string, maps: IGraphMaps): void {

        if (this.data[Storage.wordNodesId(id)]) {
            this.array2map<INode>(
                WordNodeWithKey,
                this.data[Storage.wordNodesId(id)],
                maps.nodes);
        }

        if (this.data[Storage.kanjiNodesId(id)]) {
            this.array2map<INode>(
                KanjiNodeWithKey,
                this.data[Storage.kanjiNodesId(id)],
                maps.nodes);
        }

        if (this.data[Storage.edgesId(id)]) {

            this.array2map<Edge>(
                EdgeWithKey,
                this.data[Storage.edgesId(id)],
                maps.edges);
        }
    }

    private array2map<T>(
        classType: { new(...args: any[]): { key: string, val: T } },
        data: string,
        map: { [key: string]: T }): void {

        const d = deserializeArray<{ key: string, val: T }>(classType, data);

        d.forEach((wn) => map[wn.key] = wn.val);
    }

    private map2array<T>(
        map: { [key: string]: T },
        filter: (T) => boolean): Array<{ key: string, val: T }> {

        const array: Array<{ key: string, val: T }> = [];

        for (const key in map) {
            if (map.hasOwnProperty(key)) {

                if (!filter || filter(map[key])) {
                    array.push({ key, val: map[key] as T });
                }
            }
        }

        return array;
    }
}
