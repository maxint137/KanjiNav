var Promise = require("bluebird");

var assert = require('assert');
var express = require('express');
var superagent = Promise.promisifyAll(require('superagent'));
var wagner = require('wagner-core');

var URL_ROOT = 'http://localhost:3000';

describe('Category API', function () {
    var server;
    var Category;

    before(function () {
        var app = express();

        // Bootstrap server
        var models = Promise.promisifyAll(require('./../model/models')(wagner));
        app.use(require('./api')(wagner));

        server = app.listen(3000);

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

    it('can test something', function (done) {

        var url = encodeURI(URL_ROOT + '/wordNav/word/砂糖');
        console.log('accessing ' + url);

        superagent.getAsync(url)
            .then(function (res) {
            
                var result;
                assert.doesNotThrow(function () {
                    result = JSON.parse(res.text);
                });
            
                //console.log(JSON.stringify(result));
                //console.log(JSON.stringify(result, null, '  '));

                //console.log(JSON.stringify(result.kanjis[1], null, '  '));
            
                assert.equal(result.kanjis.length, 2);
            
                assert.equal(result.kanjis[0].character, '砂');
                assert.equal(result.kanjis[1].character, '糖');

                done();

            })
            .catch(function (e) {
                assert.ifError(e);
                console.log(e);
                process.exit(-1);

            });
    });
});