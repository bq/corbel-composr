'use strict';

var phraseValidator = require('../../../src/lib/phraseValidator.js'),
    validate = require('../../../src/lib/validate'),
    chai = require('chai'),
    sinon = require('sinon'),
    expect = chai.expect,
    assert = chai.assert;

var getPhraseWithoutDoc = function() {
    return {
        url: 'url',
        get: {
            code: 'res.render(\'index\', {title: \'test\'});'
        }
    };
};

var getPhrase = function() {
    var phrase = getPhraseWithoutDoc();
    phrase.get.doc = {
        'description': 'This method will get all songs',
        'queryParameters': {
            'genre': {
                'description': 'filter the songs by genre'
            }
        },
        'responses': {
            '200': {
                'body': {
                    'application/json': {
                        'schema': '{ "$schema": "http://json-schema.org/schema"}'
                    },
                    'application/xml': null
                }
            }
        }
    };

    return phrase;
};

var getPhraseWithWrongCode = function() {
    var phrase = getPhraseWithoutDoc();
    phrase.get.doc = {
        'description': 'This method will get all songs',
        'queryParameters': {
            'genre': {
                'description': 'filter the songs by genre'
            }
        },
        'responses': {
            '200': {
                'body': {
                    'application/json': {
                        'schema': {
                            "$schema": "http://json-schema.org/schema"
                        }
                    },
                    'application/xml': null
                }
            }
        }
    };

    return phrase;
};

describe('in phraseValidator', function() {

    it('is defined and is an object', function() {
        expect(phraseValidator).to.be.an('object');
    });

    it('expected methods are available', function() {
        expect(phraseValidator).to.respondTo('validate');
    });

    describe('when validating a phrase', function() {

        it('domain is required', function() {
            expect(function() {
                phraseValidator.validate(undefined, undefined);
            }).to.throw('undefined:domain');
        });

        it('phrase is required', function() {
            expect(function() {
                phraseValidator.validate('domain', undefined);
            }).to.throw('undefined:phrase');
        });

        it('phrase.url is required', function() {
            expect(function() {
                phraseValidator.validate('domain', {});
            }).to.throw('undefined:phrase:url');
        });

        it('some http method is required', function() {
            expect(function() {
                phraseValidator.validate('domain', {
                    url: 'url'
                });
            }).to.throw('undefined:phrase:http_method');
        });

        it('code is required', function() {
            expect(function() {
                phraseValidator.validate('domain', {
                    url: 'url',
                    get: {}
                });
            }).to.throw('undefined:phrase:get:code');
        });

        it('codehash has to be valid', function() {
            expect(function() {
                phraseValidator.validate('domain', {
                    url: 'url',
                    get: {
                        codehash : 'asdasda'
                    }
                });
            }).to.throw('invalid:phrase:get:codehash');
        });

        it('codehash validates well', function() {
            var spy = sinon.spy(validate, 'isValidBase64');


            phraseValidator.validate('domain', {
                url: 'url',
                get: {
                    doc : 'eyy',
                    codehash : "cmVzLnJlbmRlcignaW5kZXgnLCB7dGl0bGU6ICdoZWxsbyB3b3JsZCd9KTs="
                }
            });


            expect(spy.calledOnce).to.equals(true);
            expect(spy.returned(true)).to.equals(true);
        });

        it('doc is required', function() {
            expect(function() {
                phraseValidator.validate('domain', getPhraseWithoutDoc());
            }).to.throw('undefined:phrase:get:doc');
        });

        it('right code syntax is required', function() {
            expect(function() {
                phraseValidator.validate('domain', {
                    url: 'url',
                    get: {
                        code: 'if (Array.isArray(x) res.push.apply(res, x);',
                        doc: ''
                    }
                });
            }).to.throw('Unexpected identifier');
        });

        it('right doc syntax is required', function(done) {
            phraseValidator.validate('domain', getPhraseWithWrongCode()).then(function() {
                assert.fail();
                done();
            }, function(error) {
                assert.equal('schema must be a string', error.message);
                done();
            }).done();
        });

        it('it works properly when all is well formed', function(done) {
            phraseValidator.validate('domain', getPhrase()).then(function() {
                done();
            }, function(error) {
                done(error);
            }).done();
        });
    });
});
