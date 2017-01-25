/*jslint node: true */
'use strict';

var d3 = require("d3");
var us = require("underscore");

var mongodb = require('mongodb');
var uri = 'mongodb://localhost:27017/TestDB';

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


var Promise = require('promise');


function extractDocs(filename, extractor) {

    return new Promise(
        function (resolve, reject) {

            var kangiDocs = [];

            d3.tsv("file:C:/Dev/EDICT/RawData/" + filename, function (error, data) {

                if (error) {
                    reject(error);
                }

                var jlpt = filename.replace(/^\D+/g, '')[0];

                data.forEach(function (d) {

                    kangiDocs.push(extractor(d, jlpt));
                });

                console.log(filename + " length = ", kangiDocs.length);
                resolve(kangiDocs);
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

var promises = KanjiList.map(function (filename) {
    return extractDocs(filename, extractKanji);
}).concat(VocabList.map(function (filename) {
    return extractDocs(filename, extractWord);
}));

Promise.all(promises)
    .then(
        function (dataGrouped) {
            mongodb.MongoClient.connect(uri, function (error, db) {
                if (error) {
                    console.log(error);
                    process.exit();
                }

                var data = dataGrouped.reduce(function (a, b) {
                    return a.concat(b);
                }, []);

                console.log("data.length = ", data.length);

                var allKanji = data.filter(function (d) {
                    return d.word === undefined
                })
                var allWords = data.filter(function (d) {
                    return d.kanji === undefined
                })

                console.log("allKanji.length = ", allKanji.length);
                console.log("allWords.length = ", allWords.length);
                
                new Promise(function (resolve, reject) {
                        db.collection("kanjiDocs").insert(allKanji,
                            function (error, result) {

                                if (error) {
                                    console.log(error);
                                    reject(error);
                                    process.exit();
                                }

                                console.log("Done with kanjiDocs");
                                resolve("done");
                            })
                    })
                    .then(function (done) {
                        db.collection("wordDocs").insert(allWords,
                            function (error, result) {

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
    .catch(function (data) {
        console.log("got error");
    });
