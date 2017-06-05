/// <reference path="../node_modules/@types/jasmine/index.d.ts" />

import { JLPTDictionary, NodeType, ApiNode } from '../scripts/kanjiNavBase'
import { Dictionary } from '../scripts/localDictionary'

describe("tests/localDictionary.ts ", () => {

    let returnedValue: any;

    beforeEach((done) => {
        returnedValue = "no_return_value";

        let dict: KNApi.JapaneseDictionary = Dictionary;
        
        let hood: JQueryPromise<KNApi.DbKanji> = dict.lookupKanji("山");

        $.when(hood).then(c => {
            returnedValue = c._dbId;
            done();
        });
    });


    it("should return success after 1 second", (done) => {
        expect(returnedValue).toEqual("山");

        done();
    });
}
);
