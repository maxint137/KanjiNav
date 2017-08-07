define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Snapshot {
        constructor(id) {
            this.id = id;
            this.nodes = [];
            this.edges = [];
        }
    }
    exports.Snapshot = Snapshot;
    class NodeDescriptor {
        constructor(name, x, y, node) {
            this.name = name;
            this.x = x;
            this.y = y;
            this.node = node;
        }
    }
    exports.NodeDescriptor = NodeDescriptor;
    class EdgeDescriptor {
        constructor(name, edge) {
            this.name = name;
            this.edge = edge;
        }
    }
    exports.EdgeDescriptor = EdgeDescriptor;
});
//# sourceMappingURL=IStorage.js.map