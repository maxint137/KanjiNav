/// <reference path="../node_modules/@types/jquery/index.d.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var KNApi;
(function (KNApi) {
    var DictEntry = (function () {
        function DictEntry() {
        }
        return DictEntry;
    }());
    KNApi.DictEntry = DictEntry;
    var WordCore = (function (_super) {
        __extends(WordCore, _super);
        function WordCore() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return WordCore;
    }(DictEntry));
    KNApi.WordCore = WordCore;
    var DbWord = (function (_super) {
        __extends(DbWord, _super);
        function DbWord() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return DbWord;
    }(WordCore));
    KNApi.DbWord = DbWord;
    var DbKanji = (function (_super) {
        __extends(DbKanji, _super);
        function DbKanji() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return DbKanji;
    }(DictEntry));
    KNApi.DbKanji = DbKanji;
})(KNApi || (KNApi = {}));
//# sourceMappingURL=knApi.js.map