define(["require", "exports", "jquery"], function (require, exports, $) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ServerDictionary = (function () {
        function ServerDictionary() {
        }
        ServerDictionary.prototype.lookup = function (type, id, jlptFilter) {
            // http://localhost:3000/api/v1/word/食品
            // http://localhost:3000/api/v1/kanji/品
            var query = "/api/v1/" + type.type + "/" + id + (jlptFilter ? '?JLPT=' + jlptFilter : '');
            return $.get(query);
        };
        return ServerDictionary;
    }());
    exports.Dictionary = new ServerDictionary();
});
//# sourceMappingURL=serverDictionary.js.map