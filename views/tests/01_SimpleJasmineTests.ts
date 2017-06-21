import "../node_modules/@types/jasmine/index.d.ts";

import * as KNApi from "../scripts/knApi";
import { Dictionary } from "../scripts/localDictionary";

describe("tests/localDictionary.ts ", () => {

    let returnedValue: any;

    beforeEach((done) => {
        returnedValue = "no_return_value";

        const dict: KNApi.IJapaneseDictionary = Dictionary;

        const hood: JQueryPromise<KNApi.DbKanji> = dict.lookupKanji("山");

        $.when(hood).then((c) => {
            returnedValue = c.dbId;
            done();
        });
    });
    it("should return success after 1 second", (done) => {
        expect(returnedValue).toEqual("山");

        done();
    });
},
);
