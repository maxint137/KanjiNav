"use strict";
/// <reference path="../node_modules/@types/jasmine/index.d.ts" />
exports.__esModule = true;
var kanjiNavBase_1 = require("../scripts/kanjiNavBase");
var localDictionary_1 = require("../scripts/localDictionary");
describe("tests/localDictionary.ts ", function () {
    var returnedValue;
    beforeEach(function (done) {
        returnedValue = "no_return_value";
        var dict = localDictionary_1.Dictionary;
        var hood = dict.lookup(kanjiNavBase_1.NodeType.Char, "山", "");
        $.when(hood).then(function (c) {
            returnedValue = c.character;
            done();
        });
    });
    it("should return success after 1 second", function (done) {
        expect(returnedValue).toEqual("山");
        done();
    });
});
