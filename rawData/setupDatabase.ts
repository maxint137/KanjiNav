import * as d3 from "d3";
import * as mongodb from "mongodb";
import * as _ from "underscore";

import * as mongoose from "mongoose";

import * as KanjiSchema from "./../model/kanji";
import * as WordSchema from "./../model/word";

const uri = "mongodb://localhost:27017/TestDB2";
// There were some strange problems with capital letters in collection names...
const kanjisCollectionName: string = "kanjis";
const wordsCollectionName: string = "words";

const KanjiList = [
    "JLPT5/KanjiList.N5.tsv",
    "JLPT4/KanjiList.N4.tsv",
    "JLPT3/KanjiList.N3.tsv",
    "JLPT2/KanjiList.N2.tsv",
    "JLPT1/KanjiList.N1.tsv",
];

const VocabList = [
    "JLPT5/VocabList.N5.tsv",
    "JLPT4/VocabList.N4.tsv",
    "JLPT3/VocabList.N3.tsv",
    "JLPT2/VocabList.N2.tsv",
    "JLPT1/VocabList.N1.tsv",
];

function extractDocs(filename, extractor) {

    return new Promise(
        (resolve, reject) => {

            const kanjiDocs = [];

            d3.tsv("file:./" + filename, (error, data) => {

                if (error) {
                    reject(error);
                }

                const jlpt = filename.replace(/^\D+/g, "")[0];

                data.forEach((d) => kanjiDocs.push(extractor(d, jlpt)));

                console.log(filename + " length = ", kanjiDocs.length);
                resolve(kanjiDocs);
            });
        });
}

function extractKanji(d, jlpt) {
    return {
        JLPT: jlpt,
        character: d.Kanji,
        english: d.English.replace(", ", ",").split(","),
        kunyomi: d.Kunyomi.split(" "),
        onyomi: d.Onyomi.split(" "),
    };
}

function extractWord(d, jlpt) {
    return {
        JLPT: jlpt,
        english: d.English.replace(", ", ",").split(","),
        hiragana: d.Hiragana,
        word: d.Kanji,
    };
}

function injectRawData() {

    const promises = KanjiList
        .map((filename) => extractDocs(filename, extractKanji))
        .concat(VocabList.map((filename) => extractDocs(filename, extractWord)));

    Promise.all(promises)
        .then(
        (dataGrouped) => {
            mongodb.MongoClient.connect(uri, (error1, db) => {
                if (error1) {
                    console.log(error1);
                    process.exit();
                }

                const data: any = dataGrouped.reduce((a: string, b: string) => a.concat(b), []);

                console.log("data.length = ", data.length);

                const allKanji = data.filter((d) => d.word === undefined);
                const allWords = data.filter((d) => d.kanji === undefined);

                console.log("allKanji.length = ", allKanji.length);
                console.log("allWords.length = ", allWords.length);

                new Promise(
                    (resolve, reject) => {
                        db.collection(kanjisCollectionName).insert(allKanji,
                            (error2, result) => {

                                if (error2) {
                                    console.log(error2);
                                    reject(error2);
                                    process.exit();
                                }

                                console.log("Done with kanjiDocs");
                                resolve("done");
                            })
                    })
                    .then((done) => {
                        db.collection(wordsCollectionName).insert(allWords,
                            (error2, result) => {

                                if (error2) {
                                    console.log(error2);
                                    process.exit();
                                }

                                console.log("Done with wordDocs");
                                db.close();

                                // step 2
                                normalizeKanji()
                            });
                    });
            });
        })
        .catch((error) => console.log(`Got an error: ${error}`));
}

function normalizeKanji() {

    mongoose.connect(uri);

    const findKanjisToNormalize = new Promise<any>(
        (resolve, reject) => {
            // find all the kanjis without the assigned words:
            mongoose.model(kanjisCollectionName, KanjiSchema).find(
                {
                    words: {
                        $exists: false,
                    },
                },
                (err, kanjis) => {

                    if (err) {
                        return reject(err);
                    }

                    resolve(kanjis);
                },
            );
        });

    findKanjisToNormalize
        .then((kanjis) => {
            console.log("Number of kanjis with missing words: " + kanjis.length);

            kanjis.map((kanji) => {
                new Promise<any>(
                    (resolve, reject) => {
                        mongoose.model(wordsCollectionName, WordSchema).find(
                            {
                                word: new RegExp(kanji.character),
                            },
                            (err, words) => {
                                if (err) {
                                    return reject(err);
                                }

                                resolve({ words, kanji });
                            });
                    },
                )
                    .then((wk) => {
                        console.log(`Mapping ${wk.words.length} words for ${wk.kanji.character} (${wk.kanji._id})`);

                        wk.words.forEach((w) => wk.kanji.words.push(w._id));

                        // save the change:
                        return new Promise<any>((resolve, reject) => {

                            wk.kanji.save((error) => {
                                if (error) {
                                    console.log(error);
                                    reject(error);
                                    process.exit(1);
                                }

                                console.log(`Saved kanji ${wk.kanji._id}`);
                                resolve();
                            });
                        });
                    })
                    .catch();
            })
        });
}

// step 1 + 2
// injectRawData();

// step 2
normalizeKanji();
