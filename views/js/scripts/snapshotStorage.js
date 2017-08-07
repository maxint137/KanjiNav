var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "underscore", "class-transformer", "./IStorage", "./knModel", "reflect-metadata"], function (require, exports, _, class_transformer_1, Storage, knModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // here we separate the nodes into the "clearly typed" arrays
    // so that de/serialization is possible
    class SnapshotDistilled {
        constructor(ss) {
            if (!ss) {
                return;
            }
            this.id = ss.id;
            this.wordNodes = [];
            this.kanjiNodes = [];
            ss.nodes.forEach((ln) => {
                if (ln.node.isKanji) {
                    this.kanjiNodes.push(new KanjiNodeEx(ln));
                }
                else {
                    this.wordNodes.push(new WordNodeEx(ln));
                }
            });
            this.edges = class_transformer_1.classToClass(ss.edges);
        }
    }
    __decorate([
        class_transformer_1.Type(() => WordNodeEx)
    ], SnapshotDistilled.prototype, "wordNodes", void 0);
    __decorate([
        class_transformer_1.Type(() => KanjiNodeEx)
    ], SnapshotDistilled.prototype, "kanjiNodes", void 0);
    __decorate([
        class_transformer_1.Type(() => knModel_1.Edge)
    ], SnapshotDistilled.prototype, "edges", void 0);
    class NameLocation {
        constructor(name, x, y) {
            this.name = name;
            this.x = x;
            this.y = y;
        }
    }
    class WordNodeEx extends NameLocation {
        constructor(wd) {
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
            this.node = class_transformer_1.classToClass(wd.node);
        }
    }
    __decorate([
        class_transformer_1.Type(() => knModel_1.WordNode)
    ], WordNodeEx.prototype, "node", void 0);
    class KanjiNodeEx extends NameLocation {
        constructor(nd) {
            if (!nd) {
                super(null, 0, 0);
                return;
            }
            super(nd.name, nd.x, nd.y);
            if (!nd.node.isKanji) {
                throw new Error("Wrong INode type passed");
            }
            this.node = nd.node;
        }
    }
    __decorate([
        class_transformer_1.Type(() => knModel_1.KanjiNode)
    ], KanjiNodeEx.prototype, "node", void 0);
    class SnapshotDB {
        constructor() {
            this.snapshots = [];
        }
        serialize(ps) {
            ps.serialize(class_transformer_1.serialize(this.snapshots));
            return;
        }
        deserialize(ps) {
            const s = ps.deserialize();
            if (!s) {
                return;
            }
            this.snapshots = class_transformer_1.deserializeArray(SnapshotDistilled, s);
            return;
        }
        saveSnapshot(ss) {
            // update or create?
            const index = this.findSnapshot(ss.id);
            if (index < 0) {
                this.createSnapshot(ss);
            }
            else {
                this.updateSnapshot(ss.id, ss);
            }
        }
        loadSnapshot(id) {
            const index = this.findSnapshot(id);
            if (index < 0) {
                return null;
            }
            const sd = this.snapshots[index];
            const ss = new Storage.Snapshot(sd.id);
            sd.wordNodes.forEach((wn) => {
                ss.nodes.push(new Storage.NodeDescriptor(wn.name, wn.x, wn.y, class_transformer_1.classToClass(wn.node)));
            });
            sd.kanjiNodes.forEach((kn) => {
                ss.nodes.push(new Storage.NodeDescriptor(kn.name, kn.x, kn.y, class_transformer_1.classToClass(kn.node)));
            });
            ss.edges = class_transformer_1.classToClass(sd.edges);
            return ss;
        }
        findSnapshot(id) {
            return _.findIndex(this.snapshots, (ss) => ss.id === id);
        }
        deleteSnapshot(id) {
            this.snapshots.splice(this.findSnapshot(id), 1);
        }
        updateSnapshot(id, ss) {
            this.deleteSnapshot(id);
            this.createSnapshot(ss);
        }
        createSnapshot(ss) {
            this.snapshots.push(class_transformer_1.classToClass(new SnapshotDistilled(ss)));
        }
    }
    __decorate([
        class_transformer_1.Type(() => SnapshotDistilled)
    ], SnapshotDB.prototype, "snapshots", void 0);
    exports.SnapshotDB = SnapshotDB;
});
//# sourceMappingURL=snapshotStorage.js.map