import "reflect-metadata";

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

    const ss = new Snapshot(id, "543");

    ss.nodes.push({
        hidden: false,
        name: "ease",
        node: nodeFactory("Word", testWords.enjoyable),
        x: 10,
        y: 100,
    });

    ss.nodes.push({
        hidden: false,
        name: "ease",
        node: nodeFactory("Kanji", testWords.ease),
        x: 20,
        y: 200,
    });

    return ss;
}

// we don't serialize the DbWord/Kanjis when taking snapshots, 
// yet these are loaded from the network, that's why we "fix" these arrays with a const
function cleanupData(ssIn, ssOut): void {

    const cleanIt = (n) => {
        n.node.nodeData.words = 7;
        n.node.nodeData.kanjis = 8;
    };

    _.forEach(ssIn.nodes, (n) => cleanIt(n));
    _.forEach(ssOut.nodes, (n) => cleanIt(n));
}

describe("SnapshotSerializer", () => {
    it("knows how to save a copy of a snapshot", () => {

        const db: SnapshotDB = new SnapshotDB();

        const ssIn: Snapshot = makeSnapshot("test");

        db.saveSnapshot(ssIn);

        const ssOut = db.loadSnapshot(ssIn.id);
        cleanupData(ssIn, ssOut);

        expect(ssOut.id).to.be.equal(ssIn.id, `Not the same id: '${ssIn.id}'/s'${ssOut.id}'`);
        expect(ssOut).to.be.deep.equal(ssIn, `Not the same object: '${ssIn.id}'/'${ssOut.id}'`);

        ssIn.id = "test1";
        expect(ssOut.id).not.to.be.equal(ssIn.id, `Not the same id: '${ssIn.id}'/'${ssOut.id}'`);
    });

    it("knows how to update a snapshot", () => {

        const db: SnapshotDB = new SnapshotDB();

        const ssIn: Snapshot = makeSnapshot("test");

        db.saveSnapshot(ssIn);
        let ssOut = db.loadSnapshot(ssIn.id);
        cleanupData(ssIn, ssOut);

        expect(ssOut)
            .to
            .be
            .deep
            .equal(ssIn,
            `Not the same object: '${ssIn.id}'`);

        ssIn.id = "test1";
        const duh = expect(db.loadSnapshot(ssIn.id)).be.null;

        db.saveSnapshot(ssIn);
        ssOut = db.loadSnapshot(ssIn.id);
        cleanupData(ssIn, ssOut);

        expect(ssOut)
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
        cleanupData(ssIn, ssOut);

        expect(ssIn)
            .to
            .be
            .deep
            .equals(ssOut,
            `Not the same object: '${ssIn.id}'`);
    });
});