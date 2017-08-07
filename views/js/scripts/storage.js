var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "class-transformer", "./knModel", "reflect-metadata"], function (require, exports, class_transformer_1, knModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class PositionMap {
    }
    exports.PositionMap = PositionMap;
    class MapElement {
        constructor(key) {
            this.key = key;
        }
    }
    ;
    class NodePosition {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }
    class NodePositionWithKey extends MapElement {
    }
    __decorate([
        class_transformer_1.Type(() => NodePosition)
    ], NodePositionWithKey.prototype, "val", void 0);
    class WordNodeWithKey extends MapElement {
    }
    __decorate([
        class_transformer_1.Type(() => knModel_1.WordNode)
    ], WordNodeWithKey.prototype, "val", void 0);
    class KanjiNodeWithKey extends MapElement {
    }
    __decorate([
        class_transformer_1.Type(() => knModel_1.KanjiNode)
    ], KanjiNodeWithKey.prototype, "val", void 0);
    class EdgeWithKey extends MapElement {
    }
    __decorate([
        class_transformer_1.Type(() => knModel_1.Edge)
    ], EdgeWithKey.prototype, "val", void 0);
    class Storage {
        constructor() {
            this.data = {};
        }
        static PositionsId(id) {
            return `${id}-positions`;
        }
        static wordNodesId(id) {
            return `${id}-wordNodes`;
        }
        static kanjiNodesId(id) {
            return `${id}-kanjiNodes`;
        }
        static edgesId(id) {
            return `${id}-edges`;
        }
        isItemAvailable(id) {
            return !(typeof this.data[Storage.PositionsId(id)] === "undefined");
        }
        saveNodesPosition(id, positions) {
            this.data[Storage.PositionsId(id)] = class_transformer_1.serialize(this.map2array(positions, null));
        }
        loadNodesPosition(id, positions) {
            this.array2map(NodePositionWithKey, this.data[Storage.PositionsId(id)], positions);
        }
        saveMaps(id, maps) {
            if (maps.nodes) {
                this.data[Storage.wordNodesId(id)]
                    = class_transformer_1.serialize(this.map2array(maps.nodes, (node) => "Word" === node.type));
                this.data[Storage.kanjiNodesId(id)]
                    = class_transformer_1.serialize(this.map2array(maps.nodes, (node) => "Kanji" === node.type));
            }
            if (maps.edges) {
                this.data[Storage.edgesId(id)]
                    = class_transformer_1.serialize(this.map2array(maps.edges, null));
            }
        }
        loadMaps(id, maps) {
            if (this.data[Storage.wordNodesId(id)]) {
                this.array2map(WordNodeWithKey, this.data[Storage.wordNodesId(id)], maps.nodes);
            }
            if (this.data[Storage.kanjiNodesId(id)]) {
                this.array2map(KanjiNodeWithKey, this.data[Storage.kanjiNodesId(id)], maps.nodes);
            }
            if (this.data[Storage.edgesId(id)]) {
                this.array2map(EdgeWithKey, this.data[Storage.edgesId(id)], maps.edges);
            }
        }
        array2map(classType, data, map) {
            const d = class_transformer_1.deserializeArray(classType, data);
            d.forEach((wn) => map[wn.key] = wn.val);
        }
        map2array(map, filter) {
            const array = [];
            for (const key in map) {
                if (map.hasOwnProperty(key)) {
                    if (!filter || filter(map[key])) {
                        array.push({ key, val: map[key] });
                    }
                }
            }
            return array;
        }
    }
    exports.Storage = Storage;
});
//# sourceMappingURL=storage.js.map