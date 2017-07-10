define(["require", "exports", "d3-request"], function (require, exports, request) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ServerDictionary {
        doLookup(id, entryType) {
            return new Promise((resolve, reject) => {
                request.json(`/api/v1/${entryType}/${id}`, (error, data) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(data);
                });
            });
        }
        lookupWord(id) {
            return this.doLookup(id, "word");
        }
        lookupKanji(id) {
            return this.doLookup(id, "kanji");
        }
    }
    exports.Dictionary = new ServerDictionary();
});
//# sourceMappingURL=serverDictionary.js.map