"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const index_1 = require("../node_modules/class-transformer/index");
const knModel_1 = require("./knModel");
class MapElement {
    constructor(key) {
        this.key = key;
    }
}
;
class WordNodeWithKey extends MapElement {
}
__decorate([
    index_1.Type(() => knModel_1.WordNode)
], WordNodeWithKey.prototype, "val", void 0);
class KanjiNodeWithKey extends MapElement {
}
__decorate([
    index_1.Type(() => knModel_1.KanjiNode)
], KanjiNodeWithKey.prototype, "val", void 0);
class GraphStorage {
    constructor() {
        this.data = {};
    }
    saveMaps(id, maps) {
        const wordNodes = [];
        const kanjiNodes = [];
        for (const key in maps.nodes) {
            if (maps.nodes.hasOwnProperty(key)) {
                if ("Word" === maps.nodes[key].type) {
                    wordNodes.push({ key, val: maps.nodes[key] });
                }
                if ("Kanji" === maps.nodes[key].type) {
                    kanjiNodes.push({ key, val: maps.nodes[key] });
                }
            }
        }
        this.data[`${id}-${GraphStorage.wordNodesSuffix}`] = index_1.serialize(wordNodes);
        this.data[`${id}-${GraphStorage.kanjiNodesSuffix}`] = index_1.serialize(kanjiNodes);
    }
    loadMaps(id, maps) {
        {
            const wordKeys = index_1.deserializeArray(WordNodeWithKey, this.data[`${id}-${GraphStorage.wordNodesSuffix}`]);
            wordKeys.forEach((wn) => maps.nodes[wn.key] = wn.val);
        }
        {
            const kanjiKeys = index_1.deserializeArray(KanjiNodeWithKey, this.data[`${id}-${GraphStorage.kanjiNodesSuffix}`]);
            kanjiKeys.forEach((kn) => maps.nodes[kn.key] = kn.val);
        }
    }
}
GraphStorage.wordNodesSuffix = "wordNodes";
GraphStorage.kanjiNodesSuffix = "kanjiNodes";
GraphStorage.edgesSuffix = "edges";
exports.GraphStorage = GraphStorage;
//# sourceMappingURL=storage.js.map