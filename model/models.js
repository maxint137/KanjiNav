var Promise = require("bluebird");
var mongoose = Promise.promisifyAll(require('mongoose')),
    Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

module.exports = function (wagner) {

    mongoose.connect('mongodb://localhost:27017/TestDB');

    var Kanji = mongoose.model('Kanji', require('./Kanji'));
    wagner.factory('Kanji', function () {
        return Kanji;
    });

    var Word = mongoose.model('Word', require('./Word'));
    wagner.factory('Word', function () {
        return Word;
    });

    var WordNav = mongoose.model('WordNav', require('./WordNav'));
    wagner.factory('WordNav', function () {
        return WordNav;
    });

    return {
        Kanji: Kanji,
        Word: Word,
        WordNav: WordNav
    };
};