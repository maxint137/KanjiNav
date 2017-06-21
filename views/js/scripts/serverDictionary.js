define(["require", "exports", "../views/node_modules/@types/jquery/index.d.ts"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ServerDictionary = (function () {
        function ServerDictionary() {
        }
        ServerDictionary.prototype.lookupWord = function (id) {
            // http://localhost:3000/api/v1/word/食品
            return $.get("/api/v1/word/" + id);
        };
        ServerDictionary.prototype.lookupKanji = function (id) {
            // http://localhost:3000/api/v1/kanji/品
            return $.get("/api/v1/kanji/" + id);
        };
        return ServerDictionary;
    }());
    exports.Dictionary = new ServerDictionary();
});
//# sourceMappingURL=serverDictionary.js.map