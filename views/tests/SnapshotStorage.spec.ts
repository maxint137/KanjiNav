// mocha -w -r views/tests/tsconfig.js --watch-extensions ts views/tests/**/SnapshotStorage.spec.ts --reporter progress
// mocha --debug-brk -r views/tests/tsconfig.js views/tests/**/SnapshotStorage.spec.ts

import { expect, should } from "chai";
import * as mocha from "mocha";
import * as _ from "underscore";
should();

import { DbKanji, DbWord } from "./../scripts/knApi";
import { Edge, INode, KanjiNode, nodeFactory, NodeTypes, WordNode } from "./../scripts/knModel";

import { Snapshot } from "../scripts/IStorage";
import { SnapshotDB } from "../scripts/snapshotStorage";

import * as testWords from "./GraphStorage.data.json";

function makeSnapshot(id: string): Snapshot {

    const ss = new Snapshot(id);

    ss.nodes.push({ name: "ease", x: 10, y: 100, node: nodeFactory("Word", testWords.enjoyable) });
    ss.nodes.push({ name: "ease", x: 20, y: 200, node: nodeFactory("Kanji", testWords.ease) });

    return ss;
}

describe("SnapshotSerializer", () => {
    it("knows how to save a copy of a snapshot", () => {

        const db: SnapshotDB = new SnapshotDB();

        const ssIn: Snapshot = makeSnapshot("test");

        db.saveSnapshot(ssIn);

        const ssOut = db.loadSnapshot(ssIn.id);

        expect(ssOut.id).to.be.equal(ssIn.id, `Not the same id: '${ssIn.id}'/s'${ssOut.id}'`);
        expect(ssOut).to.be.deep.equal(ssIn, `Not the same object: '${ssIn.id}'/'${ssOut.id}'`);

        ssIn.id = "test1";
        expect(ssOut.id).not.to.be.equal(ssIn.id, `Not the same id: '${ssIn.id}'/'${ssOut.id}'`);
    });

    it("knows how to update a snapshot", () => {

        const db: SnapshotDB = new SnapshotDB();

        const ssIn: Snapshot = makeSnapshot("test");

        db.saveSnapshot(ssIn);
        expect(db.loadSnapshot(ssIn.id))
            .to
            .be
            .deep
            .equal(ssIn,
            `Not the same object: '${ssIn.id}'`);

        ssIn.id = "test1";
        expect(db.loadSnapshot(ssIn.id))
            .not
            .to
            .be
            .deep
            .equal(ssIn,
            `The same object: '${ssIn.id}'`);

        db.saveSnapshot(ssIn);
        expect(db.loadSnapshot(ssIn.id))
            .to
            .be
            .deep
            .equal(ssIn,
            `Not the same object: '${ssIn.id}'`);
    });

    it("knows how to de/serialize", () => {

        let serializedData: string;

        const ps = {
            deserialize: () => serializedData,
            serialize: (s: string) => { serializedData = s; },
        };

        const db1: SnapshotDB = new SnapshotDB();
        const ssIn: Snapshot = makeSnapshot("test");

        db1.saveSnapshot(ssIn);
        db1.serialize(ps);

        const db2: SnapshotDB = new SnapshotDB();
        db2.deserialize(ps);
        const ssOut: Snapshot = db2.loadSnapshot(ssIn.id);

        expect(ssIn)
            .to
            .be
            .deep
            .equals(ssOut,
            `Not the same object: '${ssIn.id}'`);
    });
});
