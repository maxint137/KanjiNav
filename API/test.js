var Promise = require("bluebird");

var assert = require('assert');
var _ = require('underscore');
var express = require('express');
var superagent = Promise.promisifyAll(require('superagent'));
var wagner = require('wagner-core');

var URL_HOST = 'localhost'
var URL_PORT = 3007;
var URL_ROOT = 'http://' + URL_HOST + ':' + URL_PORT;

describe('KanjiNav API', function () {
    var server;
    var Category;

    before(function () {
        var app = express();

        // Bootstrap server
        var models = Promise.promisifyAll(require('./../model/models')(wagner));
        app.use(require('./api')(wagner));

        server = app.listen(URL_PORT);

        // Make Category model available in tests
        Kanji = models.Kanji;
    });

    after(function () {
        // Shut the server down when we're done
        server.close();
    });

    beforeEach(function (done) {
        // Make sure categories are empty before each test
        //        Category.remove({}, function (error) {
        //            assert.ifError(error);
        //            done();
        //        });
        done();

    });


    (function () {
        // UF have a test for 大部分 - the last kanji is not in the DB
        var query = '/word/品川プリンスホテル';
        query = '/word/砂糖'
        it('returns 2 (filled) kanji for GET ' + query, function (done) {

            var url = encodeURI(URL_ROOT + query);

            superagent.getAsync(url)
                .then(function (res) {
                    var word;
                    assert.doesNotThrow(function () {
                        word = JSON.parse(res.text);
                    });

                    //console.log(JSON.stringify(word, null, '  '));

                    assert.equal(word.kanjis.length, 2);

                    assert.equal(query.split('').reverse()[1], word.kanjis[0].character);
                    assert.equal(query.split('').reverse()[0], word.kanjis[1].character);

                    assert.ok(word.word);
                    assert.ok(word.hiragana);
                    assert.ok(word.JLPT);
                    assert.ok(word.english);
                    assert.equal(true, 0 in word.english);

                    word.kanjis.forEach(function (kanji) {
                        assert.equal(true, 0 in kanji.english);
                        assert.equal(true, 0 in kanji.words);

                        assert.ok(kanji.JLPT);
                        assert.ok(kanji.kunyomi);
                        assert.ok(kanji.onyomi);
                        assert.ok(kanji.english);
                    }, this);

                    done();
                })
                .catch(function (e) {
                    assert.ifError(e);
                    console.log(e);
                    process.exit(-1);

                });
        });
    })();

    (function () {
        var query = '/word/砂糖ス'
        it('can`t handle unknown words ' + query, function (done) {

            var url = encodeURI(URL_ROOT + query);

            superagent.getAsync(url)
                .then(function (res) {
                    var word;
                    assert.doesNotThrow(function () {
                        word = JSON.parse(res.text);
                    });
                    done();
                }).catch(function (e) {
                    //console.log(e)
                    assert.ifError(e);
                    done();
                });
        });
    }
    )();

    (function () {
        var query = '/kanji/砂';
        it('returns kanji with words for GET ' + query, function (done) {

            var url = encodeURI(URL_ROOT + query);
            superagent.getAsync(url)
                .then(function (res) {
                    var kanji;
                    assert.doesNotThrow(function () {
                        kanji = JSON.parse(res.text);
                    });

                    //console.log(JSON.stringify(kanji, null, '  '));

                    // check the kanji's properties
                    assert.equal(query.split('').reverse()[0], kanji.character);
                    assert.ok(kanji.JLPT);
                    assert.ok(kanji.kunyomi);
                    assert.ok(kanji.onyomi);
                    assert.ok(kanji.english);
                    assert.equal(true, 0 in kanji.english);
                    assert.equal(true, 0 in kanji.words);

                    // make sure the words are populated
                    kanji.words.forEach(function (word) {
                        assert.ok(word.word);
                        assert.ok(word.hiragana);
                        assert.ok(word.JLPT);
                        assert.ok(word.english);
                        assert.equal(true, 0 in word.english);
                    }, this);

                    done();
                })
                .catch(function (e) {
                    //console.log(e)
                    assert.ifError(e);
                    done();
                });
        })
    })();

    (function () {
        //http://localhost:3000/api/v1/kanji/%E4%BC%9A?JLPT=45
        var query = '/kanji/会?JLPT=45';
        it('filters words in kanji: ' + query, function (done) {

            var url = encodeURI(URL_ROOT + query);
            superagent.getAsync(url)
                .then(function (res) {
                    var kanji;
                    assert.doesNotThrow(function () {
                        kanji = JSON.parse(res.text);
                    });

                    // got exactly 10 words
                    assert.equal(10, kanji.words.length);

                    // all from JLPT4/5
                    kanji.words.forEach(function (w) {
                        assert.ok(4 == w.JLPT || 5 == w.JLPT);
                    }, this);

                    done();
                });
        });
    })();

});

