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

class MapElement {

    public constructor(public key: string) { }
};

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

export class GraphStorage implements IGraphStorage {

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

    public saveMaps(id: string, maps: IGraphMaps): void {

        if (maps.nodes) {
            this.data[GraphStorage.wordNodesId(id)]
                = serialize(this.map2array(maps.nodes, (node) => "Word" === node.type));

            this.data[GraphStorage.kanjiNodesId(id)]
                = serialize(this.map2array(maps.nodes, (node) => "Kanji" === node.type));
        }

        if (maps.edges) {
            this.data[GraphStorage.edgesId(id)]
                = serialize(this.map2array(maps.edges, null));
        }
    }

    public loadMaps(id: string, maps: IGraphMaps): void {

        if (this.data[GraphStorage.wordNodesId(id)]) {
            this.array2map<INode>(
                WordNodeWithKey,
                this.data[GraphStorage.wordNodesId(id)],
                maps.nodes);
        }

        if (this.data[GraphStorage.kanjiNodesId(id)]) {
            this.array2map<INode>(
                KanjiNodeWithKey,
                this.data[GraphStorage.kanjiNodesId(id)],
                maps.nodes);
        }

        if (this.data[GraphStorage.edgesId(id)]) {

            this.array2map<Edge>(
                EdgeWithKey,
                this.data[GraphStorage.edgesId(id)],
                maps.edges);
        }
    }

    private array2map<T>(
        classType: { new (...args: any[]): { key: string, val: T } },
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
