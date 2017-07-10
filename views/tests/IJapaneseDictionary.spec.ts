// mocha -w -r views/tests/tsconfig.js --watch-extensions ts --reporter dot views/tests/**/*.spec.ts

// import * as request from "request";
import * as request from "d3-request";

import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as mocha from "mocha";
import * as sinon from "sinon";
import * as stream from "stream";

chai.use(chaiAsPromised);
const should = chai.should();
const PassThrough = stream.PassThrough;

import * as KNApi from "../scripts/knApi";

import { Dictionary as DL, LocalDictionary as LocalDictionaryImp } from "../scripts/localDictionary";
import { Dictionary as DS } from "../scripts/serverDictionary";

describe("IJapaneseDictionary has two following implementations", () => {
    describe("localDictionary allows for", () => {

        // tslint:disable-next-line:only-arrow-functions space-before-function-paren
        it("kanji lookup", function (done) {

            // chaiAsPromised doesn't look practical:
            // return Dictionary.lookupKanji("山").should.eventually.have.property("JLPT").equal(5);

            DL.lookupKanji("山").then((res) => {

                res.should.have.property("JLPT").equal(5);
                res.should.have.property("character").equal("山");

                res.words.should.be.a("array");

                done();
            });
        });

        // tslint:disable-next-line:only-arrow-functions space-before-function-paren
        it("word lookup", function (done) {

            DL.lookupWord("明日").then((res) => {

                res.should.have.property("JLPT").equal(5);

                res.kanjis.should.be.a("array");
                res.kanjis.should.be.lengthOf(2);

                done();
            });
        });

        it("JLPT level parsing", () => {

            const ldImp: LocalDictionaryImp = DL as LocalDictionaryImp;
            ldImp.parseJlpt("1").should.be.equal(1);
            ldImp.parseJlpt("2").should.be.equal(2);
            ldImp.parseJlpt("3").should.be.equal(3);
            ldImp.parseJlpt("4").should.be.equal(4);
            ldImp.parseJlpt("5").should.be.equal(5);

            ldImp.parseJlpt("howdy").should.be.equal(0);
        });
    });

    describe("serverDictionary allows two lookups", () => {

        // tslint:disable-next-line:space-before-function-paren
        beforeEach(function () {
            this.stub = sinon.stub(request, "json");
        });

        // tslint:disable-next-line:space-before-function-paren
        afterEach(function () {
            this.stub.restore();
        });

        // tslint:disable-next-line:only-arrow-functions space-before-function-paren
        it("by word", function (done) {

            // tslint:disable-next-line:max-line-length
            const wordResponse = `{"_id":"5882353f4df6c0316400ef6d","word":"食品","hiragana":"しょくひん","JLPT":3,"kanjis":[{"__v":1,"JLPT":5,"character":"食","_id":"58883418e46ff154dc7c1841","words":[{"_id":"5882353f4df6c0316400e831","word":"食堂","hiragana":"しょくどう","JLPT":5,"kanjis":[],"english":["dining hall"]},{"_id":"5882353f4df6c0316400e872","word":"食べ物","hiragana":"たべもの","JLPT":5,"kanjis":[],"english":["food"]},{"_id":"5882353f4df6c0316400e873","word":"食べる","hiragana":"たべる","JLPT":5,"kanjis":[],"english":["to eat"]},{"_id":"5882353f4df6c0316400ead2","word":"食事","hiragana":"しょくじ・する","JLPT":4,"kanjis":[],"english":["to have a meal"]},{"_id":"5882353f4df6c0316400ead3","word":"食料品","hiragana":"しょくりょうひん","JLPT":4,"kanjis":[],"english":["groceries"]},{"_id":"5882353f4df6c0316400edf2","word":"食う","hiragana":"くう","JLPT":3,"kanjis":[],"english":["(male) (vulg) to eat"]},{"_id":"5882353f4df6c0316400ef6b","word":"食事","hiragana":"しょくじ","JLPT":3,"kanjis":[],"english":["meal"]},{"_id":"5882353f4df6c0316400ef6c","word":"食卓","hiragana":"しょくたく","JLPT":3,"kanjis":[],"english":["dining table"]},{"_id":"5882353f4df6c0316400ef6d","word":"食品","hiragana":"しょくひん","JLPT":3,"kanjis":[],"english":["commodity","foodstuff"]},{"_id":"5882353f4df6c0316400ef6f","word":"食物","hiragana":"しょくもつ","JLPT":3,"kanjis":[],"english":["food","foodstuff"]},{"_id":"5882353f4df6c0316400ef70","word":"食欲","hiragana":"しょくよく","JLPT":3,"kanjis":[],"english":["appetite (for food)"]},{"_id":"5882353f4df6c0316400ef71","word":"食料","hiragana":"しょくりょう","JLPT":3,"kanjis":[],"english":["food"]},{"_id":"5882353f4df6c0316400ef72","word":"食糧","hiragana":"しょくりょう","JLPT":3,"kanjis":[],"english":["provisions","rations"]},{"_id":"5882353f4df6c0316400f09c","word":"昼食","hiragana":"ちゅうしょく","JLPT":3,"kanjis":[],"english":["lunch","midday meal"]},{"_id":"5882353f4df6c0316400f390","word":"衣食住","hiragana":"いしょくじゅう","JLPT":2,"kanjis":[],"english":["necessities of life (food","clothing"," etc.)"]},{"_id":"5882353f4df6c0316400f666","word":"食塩","hiragana":"しょくえん","JLPT":2,"kanjis":[],"english":["table salt"]},{"_id":"5882353f4df6c0316400f66a","word":"食器","hiragana":"しょっき","JLPT":2,"kanjis":[],"english":["tableware"]},{"_id":"5882353f4df6c0316400fabb","word":"衣食住","hiragana":"いしょくじゅう","JLPT":1,"kanjis":[],"english":["necessities of life (food","clothing"," etc.)"]},{"_id":"5882353f4df6c0316400fd91","word":"食塩","hiragana":"しょくえん","JLPT":1,"kanjis":[],"english":["table salt"]},{"_id":"5882353f4df6c0316400fd95","word":"食器","hiragana":"しょっき","JLPT":1,"kanjis":[],"english":["tableware"]}],"english":["eat","food"],"kunyomi":["く.う","く.らう","た.べる"],"onyomi":["ショク","ジキ","ハ."]},{"__v":1,"JLPT":4,"character":"品","_id":"58883418e46ff154dc7c1892","words":[{"_id":"5882353f4df6c0316400eaba","word":"品物","hiragana":"しなもの","JLPT":4,"kanjis":[],"english":["goods"]},{"_id":"5882353f4df6c0316400ead3","word":"食料品","hiragana":"しょくりょうひん","JLPT":4,"kanjis":[],"english":["groceries"]},{"_id":"5882353f4df6c0316400eeb4","word":"作品","hiragana":"さくひん","JLPT":3,"kanjis":[],"english":["work","opus","performance","production"]},{"_id":"5882353f4df6c0316400ef06","word":"品","hiragana":"しな","JLPT":3,"kanjis":[],"english":["thing","article","goods","dignity","article (goods)","counter for meal courses"]},{"_id":"5882353f4df6c0316400ef64","word":"商品","hiragana":"しょうひん","JLPT":3,"kanjis":[],"english":["commodity","article of commerce","goods","stock","merchandise"]},{"_id":"5882353f4df6c0316400ef6d","word":"食品","hiragana":"しょくひん","JLPT":3,"kanjis":[],"english":["commodity","foodstuff"]},{"_id":"5882353f4df6c0316400efdb","word":"製品","hiragana":"せいひん","JLPT":3,"kanjis":[],"english":["manufactured goods","finished goods"]},{"_id":"5882353f4df6c0316400f0da","word":"手品","hiragana":"てじな","JLPT":3,"kanjis":[],"english":["sleight of hand","conjuring trick","magic","juggling"]},{"_id":"5882353f4df6c0316400f1f9","word":"品","hiragana":"ひん","JLPT":3,"kanjis":[],"english":["thing","article","goods","dignity","article (goods)","counter for meal courses"]},{"_id":"5882353f4df6c0316400f52b","word":"下品","hiragana":"げひん","JLPT":2,"kanjis":[],"english":["vulgarity","meanness","indecency","coarseness"]},{"_id":"5882353f4df6c0316400f65b","word":"賞品","hiragana":"しょうひん","JLPT":2,"kanjis":[],"english":["prize","trophy"]},{"_id":"5882353f4df6c0316400f855","word":"日用品","hiragana":"にちようひん","JLPT":2,"kanjis":[],"english":["daily necessities"]},{"_id":"5882353f4df6c0316400f8db","word":"必需品","hiragana":"ひつじゅひん","JLPT":2,"kanjis":[],"english":["necessities","necessary article","requisite","essential"]},{"_id":"5882353f4df6c0316400f922","word":"部品","hiragana":"ぶひん","JLPT":2,"kanjis":[],"english":["parts","accessories"]},{"_id":"5882353f4df6c0316400fa07","word":"薬品","hiragana":"やくひん","JLPT":2,"kanjis":[],"english":["medicine(s)","chemical(s)"]},{"_id":"5882353f4df6c0316400fa2e","word":"洋品店","hiragana":"ようひんてん","JLPT":2,"kanjis":[],"english":["shop which handles Western-style apparel and accessories"]},{"_id":"5882353f4df6c0316400fc56","word":"下品","hiragana":"げひん","JLPT":1,"kanjis":[],"english":["vulgarity","meanness","indecency","coarseness"]},{"_id":"5882353f4df6c0316400fd86","word":"賞品","hiragana":"しょうひん","JLPT":1,"kanjis":[],"english":["prize","trophy"]},{"_id":"5882353f4df6c0316400ff80","word":"日用品","hiragana":"にちようひん","JLPT":1,"kanjis":[],"english":["daily necessities"]},{"_id":"5882353f4df6c03164010006","word":"必需品","hiragana":"ひつじゅひん","JLPT":1,"kanjis":[],"english":["necessities","necessary article","requisite","essential"]},{"_id":"5882353f4df6c0316401004d","word":"部品","hiragana":"ぶひん","JLPT":1,"kanjis":[],"english":["parts","accessories"]},{"_id":"5882353f4df6c03164010132","word":"薬品","hiragana":"やくひん","JLPT":1,"kanjis":[],"english":["medicine(s)","chemical(s)"]},{"_id":"5882353f4df6c03164010159","word":"洋品店","hiragana":"ようひんてん","JLPT":1,"kanjis":[],"english":["shop which handles Western-style apparel and accessories"]}],"english":["goods","refinement"," dignity"," article"," counter for meal courses"],"kunyomi":["しな"],"onyomi":["ヒン","ホン"]}],"english":["commodity","foodstuff"]}`;

            this.stub.callsArgWith(1, null, JSON.parse(wordResponse));

            DS.lookupWord("食品").then((res) => {

                res.should.have.property("JLPT").equal(3);

                res.kanjis.should.be.a("array");
                res.kanjis.should.be.lengthOf(2);
                done();
            });
        });

        // tslint:disable-next-line:only-arrow-functions space-before-function-paren
        it("by kanji", function (done) {

            const kanjiResponse =
                // tslint:disable-next-line:max-line-length
                `{"_id":"58883418e46ff154dc7c182c","character":"山","JLPT":5,"__v":1,"words":[{"_id":"5882353f4df6c0316400e978","word":"山","hiragana":"やま","JLPT":5,"kanjis":[],"english":["mountain"]},{"_id":"5882353f4df6c0316400f110","word":"登山","hiragana":"とざん","JLPT":3,"kanjis":[],"english":["mountain-climbing"]},{"_id":"5882353f4df6c0316400f466","word":"火山","hiragana":"かざん","JLPT":2,"kanjis":[],"english":["volcano"]},{"_id":"5882353f4df6c0316400f5d7","word":"山林","hiragana":"さんりん","JLPT":2,"kanjis":[],"english":["mountain forest","mountains and forest"]},{"_id":"5882353f4df6c0316400fb91","word":"火山","hiragana":"かざん","JLPT":1,"kanjis":[],"english":["volcano"]},{"_id":"5882353f4df6c0316400fd02","word":"山林","hiragana":"さんりん","JLPT":1,"kanjis":[],"english":["mountain forest","mountains and forest"]}],"english":["mountain"],"kunyomi":[""],"onyomi":["サン","セン","ヤ"]}`;

            this.stub.callsArgWith(1, null, JSON.parse(kanjiResponse));

            DS.lookupKanji("山").then((res) => {

                res.should.have.property("JLPT").equal(5);
                res.should.have.property("character").equal("山");

                res.words.should.be.a("array");
                done();
            });
        });
    });
});
