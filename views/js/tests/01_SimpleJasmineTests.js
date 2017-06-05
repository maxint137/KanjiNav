/// <reference path="../node_modules/@types/jasmine/index.d.ts" />
define(["require", "exports", "../scripts/localDictionary"], function (require, exports, localDictionary_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe("tests/localDictionary.ts ", function () {
        var returnedValue;
        beforeEach(function (done) {
            returnedValue = "no_return_value";
            var dict = localDictionary_1.Dictionary;
            var hood = dict.lookupKanji("山");
            $.when(hood).then(function (c) {
                returnedValue = c._dbId;
                done();
            });
        });
        it("should return success after 1 second", function (done) {
            expect(returnedValue).toEqual("山");
            done();
        });
    });
});
//# sourceMappingURL=01_SimpleJasmineTests.js.map