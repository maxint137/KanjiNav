var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "class-transformer"], function (require, exports, class_transformer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class DictEntry {
    }
    exports.DictEntry = DictEntry;
    class WordCore extends DictEntry {
    }
    exports.WordCore = WordCore;
    class DbWord extends WordCore {
    }
    __decorate([
        class_transformer_1.Exclude()
    ], DbWord.prototype, "kanjis", void 0);
    exports.DbWord = DbWord;
    class DbKanji extends DictEntry {
    }
    __decorate([
        class_transformer_1.Exclude()
    ], DbKanji.prototype, "words", void 0);
    exports.DbKanji = DbKanji;
});
//# sourceMappingURL=knApi.js.map