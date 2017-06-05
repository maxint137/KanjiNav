define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var NodeType = (function () {
        function NodeType(type, id, // the name of the ID field
            castSel) {
            this.type = type;
            this.id = id;
            this.castSel = castSel;
        }
        NodeType.prototype.toString = function () {
            return this.type;
        };
        NodeType.prototype.next = function () {
            return this === NodeType.Word ? NodeType.Char : NodeType.Word;
        };
        return NodeType;
    }());
    NodeType.Word = new NodeType("word", "word", 'kanjis');
    NodeType.Char = new NodeType("kanji", "character", 'words');
    exports.NodeType = NodeType;
    var ApiNode = (function () {
        function ApiNode() {
        }
        return ApiNode;
    }());
    exports.ApiNode = ApiNode;
});
//# sourceMappingURL=kanjiNavBase.js.map