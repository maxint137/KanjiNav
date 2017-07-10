import { should } from "chai";
import * as mocha from "mocha";
import * as sinon from "sinon";
should();

import * as KNApi from "../scripts/knApi";
import { Dictionary } from "../scripts/serverDictionary";

describe("serverDictionary implementation of IJapaneseDictionary", () => {

    const data = [
        { x: 0, y: 0, radius: 5 },
        { x: 10, y: 10, radius: 10 }
    ];
    let server: sinon.SinonFakeServer;

    beforeEach(() => {
        server = sinon.fakeServer.create();
    });
    afterEach(() => {
        server.restore();
    });

    it("should lookup a kanji within a second", (done) => {

        Dictionary.lookupKanji("山").then((res) => {

            res.JLPT.should.be.a("number");

            res.character.should.be.a("string");
            res.character.should.be.equal("山");

            res.words.should.be.a("array");

            done();
        });
    });

    it("word lookup should return within a second", (done) => {

        Dictionary.lookupWord("明日").then((res) => {

            res.JLPT.should.be.a("number");

            res.kanjis.should.be.a("array");
            res.kanjis.should.be.lengthOf(2);

            done();
        });
    });
});
