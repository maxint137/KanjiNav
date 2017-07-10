import * as d3 from "d3";
import * as _ from "underscore";
import * as mongodb from "mongodb";

var uri = 'mongodb://localhost:27017/TestDB2';

var KanjiList = ["JLPT5/KanjiList.N5.tsv",
    "JLPT4/KanjiList.N4.tsv",
    "JLPT3/KanjiList.N3.tsv",
    "JLPT2/KanjiList.N2.tsv",
    "JLPT1/KanjiList.N1.tsv"
];

var VocabList = ["JLPT5/VocabList.N5.tsv",
    "JLPT4/VocabList.N4.tsv",
    "JLPT3/VocabList.N3.tsv",
    "JLPT2/VocabList.N2.tsv",
    "JLPT1/VocabList.N1.tsv"
];

function extractDocs(filename, extractor) {

    const test = new Promise<number>((resolve, reject) => {

    })

    return new Promise(
        function (resolve, reject) {

            var kanjiDocs = [];

            d3.tsv("file:./" + filename, function (error, data) {

                if (error) {
                    reject(error);
                }

                const jlpt = filename.replace(/^\D+/g, '')[0];

                data.forEach(function (d) {

                    kanjiDocs.push(extractor(d, jlpt));
                });

                console.log(filename + " length = ", kanjiDocs.length);
                resolve(kanjiDocs);
            });
        });
}

function extractKanji(d, jlpt) {
    return {
        character: d.Kanji,
        onyomi: d.Onyomi.split(' '),
        kunyomi: d.Kunyomi.split(' '),
        english: d.English.replace(', ', ',').split(','),
        JLPT: jlpt
    };
}

function extractWord(d, jlpt) {
    return {
        word: d.Kanji,
        hiragana: d.Hiragana,
        english: d.English.replace(', ', ',').split(','),
        JLPT: jlpt
    };
}

var promises = KanjiList
    .map(filename => extractDocs(filename, extractKanji))
    .concat(VocabList.map(filename => extractDocs(filename, extractWord)));

Promise.all(promises)
    .then(
    dataGrouped => {
        mongodb.MongoClient.connect(uri, (error, db) => {
            if (error) {
                console.log(error);
                process.exit();
            }

            const data: any = dataGrouped.reduce((a: string, b: string) => a.concat(b), []);

            console.log("data.length = ", data.length);

            var allKanji = data.filter(d => d.word === undefined);
            var allWords = data.filter(d => d.kanji === undefined);

            console.log("allKanji.length = ", allKanji.length);
            console.log("allWords.length = ", allWords.length);

            new Promise(
                (resolve, reject) => {
                    db.collection("kanjiDocs").insert(allKanji,
                        (error, result) => {

                            if (error) {
                                console.log(error);
                                reject(error);
                                process.exit();
                            }

                            console.log("Done with kanjiDocs");
                            resolve("done");
                        })
                })
                .then((done) => {
                    db.collection("wordDocs").insert(allWords,
                        (error, result) => {

                            if (error) {
                                console.log(error);
                                process.exit();
                            }

                            console.log("Done with wordDocs");
                            db.close();
                        });
                });
        });
    })
    .catch((error) => console.log(`Got an error: ${error}`));
