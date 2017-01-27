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
            // TODO: make sure the word is valid

            Promise.map(rqWord.split(''), function (nextChar, index) {

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