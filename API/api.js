// infra
var Promise = require("bluebird");

var _ = require('underscore');
var express = require('express');
var status = require('http-status');

module.exports = function (wagner) {
    var api = express.Router();

    function extractKanjis(word) {
        // keeping only the kanji
        // match the range: 0x4e00 - 0x9faf  (http://www.rikai.com/library/kanjitables/kanji_codes.unicode.shtml)
        // http://stackoverflow.com/questions/15033196/using-javascript-to-check-whether-a-string-contains-japanese-characters-includi
        var kanjiRex = /[\u4e00-\u9faf]/g;

        // filter out katakana and hiragana chars
        return word.match(kanjiRex);
    }

    /** 
     *  Query for a specific kanji
     */
    var path = '/kanji/:kanji';
    api.get(path, wagner.invoke(function (Kanji) {

        return function (req, res) {

            res.setHeader('Access-Control-Allow-Origin', '*');
            var kanji = req.params.kanji[0];

            Kanji.findOne({
                character: new RegExp(kanji)
            })
                .populate('words')
                .then(function (populated) {
                    // keep only the requested levels
                    if (req.query.JLPT) {
                        var reqLevels = req.query.JLPT.split('');

                        populated.words = _.filter(populated.words, function (w) { return -1 != reqLevels.indexOf(''+w.JLPT)});
                    }

                    return res.json(populated);
                })
        };
    }));

    /** 
     *  Query for a specific word
     */
    var path = '/word/:word';
    api.get(path, wagner.invoke(function (Word) {

        return function (req, res) {

            res.setHeader('Access-Control-Allow-Origin', '*');

            var rqWord = req.params.word;

            return Word.findOneAsync({
                word: new RegExp(rqWord)
            })
                .then(function (wordFound) {
                    // UF: it might happen that we don't have this word
                    if (null === wordFound) {
                        return res.json(wordFound)

                        // return res.
                        // status(status.INTERNAL_SERVER_ERROR).
                        // json({
                        //     error: "Unknown word " + rqWord
                        // });
                    }

                    var kanjis = extractKanjis(wordFound.word);

                    wagner.invoke(function (Kanji) {

                        Promise.map(kanjis, function (nextChar) {
                            return Kanji.findOne({
                                character: new RegExp(nextChar)
                            })
                                .populate('words');

                        }).then(function (kanjis) {

                            wordFound.kanjis = kanjis;
                            return res.json(wordFound);
                        });
                    });
                });
        }
    }));

    return api;
};



