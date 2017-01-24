var _ = require('underscore');
var assert = require('assert');
var interfaces = require('./interfaces');
var connect = require('./connectTestDB');
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var wordSchema = require('./word');
var kanjiSchema = require('./kanji');
var wordConnectedSchema = require('./wordConnected');
var Promise = require("bluebird");


describe('interfaces', function () {
    var db;
    var succeeded = 0;
    var georgeLucasMovies;

    it('can use the mongoose schema', function (done) {

        // Use native promises
        mongoose.Promise = global.Promise;
        Promise.promisifyAll(require("mongoose"));

        mongoose.connect('mongodb://localhost:27017/TestDB');

        var yamaKanji;
        var KanjiModel = mongoose.model('Kanji', kanjiSchema, 'kanjis');
        KanjiModel.findAsync({
            kanji: /山/
        }).then(function (kanjis) {
            yamaKanji = kanjis[0];

            console.log(yamaKanji);

            var WordConnectedModel = mongoose.model('WordConnected', wordConnectedSchema, 'newSchema');

            var wc = new WordConnectedModel({
                word: {
                    word: '山山',
                    hiragana: 'やまやま',
                    english: 'mountain x2',
                    JLPT: 1
                }
            });

            
            wc.kanjis.push(yamaKanji._id)

            wc.save(function (error) {
                if (error) {
                    console.log(error);
                    process.exit(1);
                }
            });
            done();

        }).catch(function (e) {
            console.error(e);
        });

    });

    it('can get words connected to a given word', function (done) {
        interfaces.getConnectedWords(db, '青山', function (error, words) {

            assert.ifError(error);
            assert.ok(Array.isArray(words));
            assert.equal(words.length, 15);
            assert.equal(words[0].word, '青');

            var curJlpt = words[0].JLPT;
            words.slice(0, 9).forEach(function (word) {
                assert.ok(word.JLPT <= curJlpt);
                curJlpt = word.JLPT;
            });
            done();
        });
    });

    it('ignores katakana/hiragana', function (done) {
        interfaces.getConnectedWords(db, '青いダ', function (error, words) {

            assert.ifError(error);
            assert.ok(Array.isArray(words));
            assert.equal(words.length, 9);
            assert.equal(words[0].word, '青');
            done();
        });
    });

    it('handles unknown word', function (done) {
        interfaces.getConnectedWords(db, 'セゲ', function (error, words) {

            assert.ifError(error);
            assert.ok(Array.isArray(words));
            assert.equal(words.length, 0);
            done();
        });
    });

    it('can get grouped-words connected to a given word', function (done) {
        interfaces.getConnectedWordsGrouped(db, '青山', function (error, groupsOfWords) {

            assert.ifError(error);
            assert.ok(Array.isArray(groupsOfWords));
            assert.equal(groupsOfWords.length, 2);

            assert.equal(groupsOfWords[0].words[0].word, '青');
            assert.equal(groupsOfWords[0].kanji, '青');

            assert.equal(groupsOfWords[1].words[0].word, '山');
            assert.equal(groupsOfWords[1].kanji, '山');

            var curJlpt = groupsOfWords[0].words[0].JLPT;
            groupsOfWords[0].words.forEach(function (word) {
                assert.ok(word.JLPT <= curJlpt);
                curJlpt = word.JLPT;
            });

            curJlpt = groupsOfWords[1].words[0].JLPT;
            groupsOfWords[1].words.forEach(function (word) {
                assert.ok(word.JLPT <= curJlpt);
                curJlpt = word.JLPT;
            });
            done();
        });
    });



    before(function (done) {

        connect(function (error, conn) {
            if (error) {
                return done(error);
            }
            db = conn;
            done();
        });
    });


    after(function (done) {
        db.close(done);
    });
});