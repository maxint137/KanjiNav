import * as KNApi from "../scripts/knApi";
import { Dictionary } from "../scripts/localDictionary";

describe("tests/localDictionaryTest.ts ", () => {

    let returnedValue: any = 7;

    beforeEach((done) => {
        returnedValue = "no_return_value";

        const dict: KNApi.IJapaneseDictionary = Dictionary;

        const hood: JQueryPromise<KNApi.DbKanji> = dict.lookupKanji("山");

        $.when(hood).then((k: KNApi.DbKanji) => {
            returnedValue = k.character;
            done();
        });
    });

    it("should return success after 1 second", (done) => {
        expect(returnedValue).toEqual("山");
        done();
    });
});
