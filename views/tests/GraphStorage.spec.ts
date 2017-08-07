// tslint:disable:no-unused-expression
// mocha -w -r views/tests/tsconfig.js --watch-extensions ts views/tests/**/GraphStorage.spec.ts --reporter
// mocha --debug-brk -r views/tests/tsconfig.js views/tests/**/GraphStorage.spec.ts
// "C:\Program Files (x86)\nodejs\node.exe" --debug-brk=17892 --nolazy
//      c:\Users\maxlevy\AppData\Roaming\npm\node_modules\mocha\bin\_mocha
//      c:\Dev\KanjiNav\views\tests\GraphStorage.spec.js --no-timeouts

import { expect, should } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as mocha from "mocha";
import * as sinon from "sinon";
import * as _ from "underscore";
should();

import * as testWords from "./GraphStorage.data.json";

import { DbWord, JlptLevel } from "../scripts/KNApi";
import { IGraphStorage, PositionMap, Storage } from "../scripts/storage";
import { Edge, INode, KanjiNode, NodeTypes, WordNode } from "./../scripts/knModel";

const enjoyable = "enjoyable";
const pronunciation = "pronunciation";
const ease = "ease";

const wordsList = [
    { word: enjoyable, hoodCount: 1 },
    { word: pronunciation, hoodCount: 2 },
    { word: ease, hoodCount: 9 },
];

describe("Serializer", () => {
    it("knows how to save ViewNodePositions", () => {

        const viewNodePositions: PositionMap = {
            node1: { x: 10, y: 100 },
            node2: { x: 11, y: 101 },
        };

        const ts = new Storage();
        expect(ts.isItemAvailable("test")).is.false;

        ts.saveNodesPosition("test_00", viewNodePositions);
        expect(ts.isItemAvailable("test_00")).is.true;
        expect(ts.isItemAvailable("test_001")).is.false;

        const loadedNodePositions: PositionMap = {};
        ts.loadNodesPosition("test_00", loadedNodePositions);
        expect(ts.isItemAvailable("test_00")).is.true;

        expect(loadedNodePositions).to.be.deep.equal(viewNodePositions);
    });

    it("knows how to save a single node", () => {

        const oneNode: { [key: string]: INode } = {};
        oneNode["only-you"] = testWords[enjoyable];

        const ts = new Storage();
        ts.saveMaps("test_01", { nodes: oneNode, edges: null });
    });

    it("knows how to save a single edge", () => {

        const oneEdge: { [key: string]: Edge } = {};
        oneEdge["0"] = Edge.makeEdge("Word", "Start", "End");

        const gs = new Storage();
        gs.saveMaps("test_02", { nodes: null, edges: oneEdge });

        const oneEdgeLoaded: { [key: string]: Edge } = {};
        gs.loadMaps("test_02", { nodes: null, edges: oneEdgeLoaded });

        expect(oneEdge[0]).not.to.be.undefined;
        expect(oneEdgeLoaded[0]).not.to.be.undefined;

        expect(oneEdge[0]).to.haveOwnProperty("source");
        expect(oneEdge[0]).to.haveOwnProperty("target");

        expect(oneEdgeLoaded[0]).to.haveOwnProperty("source");
        expect(oneEdgeLoaded[0]).to.haveOwnProperty("target");

        expect(oneEdge[0].source).to.be.equal(oneEdgeLoaded[0].source);
        expect(oneEdge[0].target).to.be.equal(oneEdgeLoaded[0].target);
        expect(oneEdge[0].toString()).to.be.equal(oneEdgeLoaded[0].toString());
    });

    it("knows how to load saved nodes+edges", () => {

        const savedNodes: { [key: string]: INode } = {};

        wordsList.forEach((wd) => {

            const word = testWords[wd.word];

            expect(word, wd.word)
                .not.to.be.undefined;

            savedNodes[wd.word] = word.word
                ? new WordNode(word)
                : new KanjiNode(word)
                ;
        });

        dataValidation(savedNodes, "BEFORE >>");

        const loadedNodes: { [key: string]: INode } = {};

        const gs = new Storage();
        gs.saveMaps("saveId", { nodes: savedNodes, edges: null });
        gs.loadMaps("saveId", { nodes: loadedNodes, edges: null });

        expect(loadedNodes, "loadedNodes is missing a key")
            .to.have.all.keys(_.map(wordsList, (_) => _.word));

        dataValidation(loadedNodes, "AFTER <<");
    });
});

function dataValidation(nodes: { [key: string]: INode }, context: string): void {

    expect(nodes, `${context}: d is missing a key`).to.have.all.keys(_.map(wordsList, (_) => _.word));

    wordsList.forEach((wd) => {

        expect(nodes[wd.word].hood, `${context}: hood is present for ${wd.word}`)
            .not.to.be.undefined;

        expect(nodes[wd.word].hood, `${context}: d['${wd.word}'].hood's length'`)
            .to.have.lengthOf(wd.hoodCount);
    });
}
