var assert = require('assert');
var assert = require('assert');
var interfaces = require('./interfaces');
var connect = require('./connectTestDB');
var _ = require('underscore');

describe('interfaces', function () {
    var db;
    var succeeded = 0;
    var georgeLucasMovies;

    it('can get words connected to a given word', function (done) {
        interfaces.getConnectedWords(db, '青山', function (error, words) {

            assert.ifError(error);
            assert.ok(Array.isArray(words));
            assert.equal(words.length, 15);
            assert.equal(words[0].word, '青');
            
            var curJlpt = words[0].JLPT;
            words.slice(0,9).forEach(function(word){
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
            groupsOfWords[0].words.forEach(function(word){
                assert.ok(word.JLPT <= curJlpt);
                curJlpt = word.JLPT;
            });

            curJlpt = groupsOfWords[1].words[0].JLPT;
            groupsOfWords[1].words.forEach(function(word){
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
