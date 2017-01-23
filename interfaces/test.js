var assert = require('assert');
var assert = require('assert');
var interfaces = require('./interfaces');
var connect = require('./connectTestDB');

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
                
                console.log("curJlpt/word.JLPT", curJlpt, "/", word.JLPT);
                
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
