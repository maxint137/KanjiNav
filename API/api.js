// infra
var Promise = require("bluebird");

var _ = require('underscore');
var express = require('express');
var status = require('http-status');

module.exports = function (wagner) {
    var api = express.Router();

    var path = '/wordNav/word/:word';
    api.get(path, wagner.invoke(function (Kanji) {

        return function (req, res) {

            var rqWord = req.params.word;

            // keeping only the kanji
            // match the range: 0x4e00 - 0x9faf  (http://www.rikai.com/library/kanjitables/kanji_codes.unicode.shtml)
            // http://stackoverflow.com/questions/15033196/using-javascript-to-check-whether-a-string-contains-japanese-characters-includi
            var kanjiRex = /[\u4e00-\u9faf]/g;

            // filter out katakana and hiragana chars
            var kanjis = rqWord.match(kanjiRex);
            if (null == kanjis) {
                return res.
                status(status.NOT_FOUND).
                json({
                    error: "No kanji found in " + rqWord
                });
            }

            Promise.map(kanjis, function (nextChar, index) {
                    return Kanji.find({
                            character: new RegExp(nextChar)
                        })
                        .populate('words');
                })
                .then(function (kanjis) {
                    // make sure we don't have multiple entries for the same kanji:
                    if (1 < _.max(_.map(kanjis, function (k) {
                            return k.length;
                        }))) {
                        return res.
                        status(status.INTERNAL_SERVER_ERROR).
                        json({
                            error: "More than a single kanji found in " + rqWord
                        });
                    }

                    res.json({
                        kanjis: _.map(kanjis, function (ks) {
                            return ks[0];
                        })
                    });
                });
        };
    }));
    return api;
};