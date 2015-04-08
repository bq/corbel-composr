'use strict';

var phraseManager = require('../../../src/lib/phraseManager.js'),
    chai = require('chai'),
    expect = chai.expect,
    assert = chai.assert,
    express = require('express'),
    router = express.Router();

var getPhrase = function(id) {
    var code = 'res.render(\'index\', {title: \'test\'});';
    return {
        id: id,
        get: {
            code: code
        },
        post: {
            code: code
        },
        put: {
            code: code
        },
        delete: {
            code: code
        }
    };
};

describe('in phraseManager module', function() {

    it('is defined and is an object', function() {
        expect(phraseManager).to.be.an('object');
    });

    it('expected methods are available', function() {
        expect(phraseManager).to.respondTo('registerPhrase');
        expect(phraseManager).to.respondTo('unregisterPhrase');
    });

    describe('when registering a phrase', function() {

        it('router is required', function() {
            expect(function() {
                phraseManager.registerPhrase();
            }).to.throw('undefined:router');
        });

        it('phrase is required', function() {
            expect(function() {
                phraseManager.registerPhrase({});
            }).to.throw('undefined:phrase');
        });

        it('it registers the expected phrases', function() {

            var routerstacklength = router.stack.length;

            for (var i = 0; i < 2; i++) {
                phraseManager.registerPhrase(router, getPhrase('domain!test' + i));
            }

            assert.equal(router.stack.length, routerstacklength + 8);
        });
    });

    describe('when unregistering a phrase', function() {

        it('router is required', function() {
            expect(function() {
                phraseManager.unregisterPhrase();
            }).to.throw('undefined:router');
        });

        it('phrase object is required', function() {
            expect(function() {
                phraseManager.unregisterPhrase({});
            }).to.throw('undefined:phrase');
        });

        it('phrase.id is required', function() {
            expect(function() {
                phraseManager.unregisterPhrase({}, {});
            }).to.throw('undefined:phrase:id');
        });

        it('it deletes the expected phrases', function() {
            var routerstacklength = router.stack.length;
            phraseManager.registerPhrase(router, getPhrase('domain!delete'));
            phraseManager.registerPhrase(router, getPhrase('domain!nodelete'));
            assert.equal(router.stack.length, routerstacklength + 8);

            routerstacklength = router.stack.length;
            phraseManager.unregisterPhrase(router, {
                id: 'domain!delete'
            });
            assert.equal(router.stack.length, routerstacklength - 4);
        });

    });
});
