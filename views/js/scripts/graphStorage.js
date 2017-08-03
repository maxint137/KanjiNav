var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "class-transformer", "./knModel", "reflect-metadata"], function (require, exports, class_transformer_1, knModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MapElement {
        constructor(key) {
            this.key = key;
        }
    }
    ;
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
    class GraphStorage {
        constructor() {
            this.data = {};
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
        saveMaps(id, maps) {
            if (maps.nodes) {
                this.data[GraphStorage.wordNodesId(id)]
                    = class_transformer_1.serialize(this.map2array(maps.nodes, (node) => "Word" === node.type));
                this.data[GraphStorage.kanjiNodesId(id)]
                    = class_transformer_1.serialize(this.map2array(maps.nodes, (node) => "Kanji" === node.type));
            }
            if (maps.edges) {
                this.data[GraphStorage.edgesId(id)]
                    = class_transformer_1.serialize(this.map2array(maps.edges, null));
            }
        }
        loadMaps(id, maps) {
            if (this.data[GraphStorage.wordNodesId(id)]) {
                this.array2map(WordNodeWithKey, this.data[GraphStorage.wordNodesId(id)], maps.nodes);
            }
            if (this.data[GraphStorage.kanjiNodesId(id)]) {
                this.array2map(KanjiNodeWithKey, this.data[GraphStorage.kanjiNodesId(id)], maps.nodes);
            }
            if (this.data[GraphStorage.edgesId(id)]) {
                this.array2map(EdgeWithKey, this.data[GraphStorage.edgesId(id)], maps.edges);
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
    exports.GraphStorage = GraphStorage;
});
//# sourceMappingURL=graphStorage.js.map