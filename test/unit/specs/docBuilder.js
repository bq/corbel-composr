'use strict';

var docBuilder = require('../../../src/lib/docBuilder.js'),
    chai = require('chai'),
    expect = chai.expect,
    config = require('../../../src/config/config.json'),
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

describe('in docBuilder', function() {

    var baseUri = config['corbel.driver.options'].urlBase.replace('{{module}}', '');

    it('is defined and is an object', function() {
        expect(docBuilder).to.be.an('object');
    });

    it('expected methods are available', function() {
        expect(docBuilder).to.respondTo('load');
        expect(docBuilder).to.respondTo('buildDefinition');
    });

    describe('when building a raml definition from a phrase', function() {

        it('doc inside a method is required', function() {
            expect(function() {
                docBuilder.buildDefinition('domain', getPhraseWithoutDoc());
            }).to.throw('undefined:phrase:get:doc');
        });

        it('it builds the expected definition', function() {
            var expected = '#%RAML 0.8\n---\ntitle: url\nbaseUri: ' + baseUri + 'domain\n\'/url:\':\n    get:\n        description: \'This method will get all songs\'\n        queryParameters:\n            genre: {description: \'filter the songs by genre\'}\n        responses:\n            \'200\': {body: {application/json: {schema: \'{ "$schema": "http://json-schema.org/schema"}\'}, application/xml: null}}\n';
            assert.equal(expected, docBuilder.buildDefinition('domain', getPhrase()));
        });
    });

    describe('when loading a raml definition from a phrase', function() {

        it('domain is required', function() {
            expect(function() {
                docBuilder.load();
            }).to.throw('undefined:domain');
        });

        it('phrase is required', function() {
            expect(function() {
                docBuilder.load('domain');
            }).to.throw('undefined:phrase');
        });

        it('the built definition can be loaded by raml', function(done) {
            docBuilder.load('domain', getPhrase()).then(function(result) {
            	assert.equal('url', result.title);
            	assert.equal(baseUri + 'domain', result.baseUri);
            	assert.include('HTTPS', result.protocols);
            	assert.equal('get', result.resources[0].methods[0].method);
            	done();
            }, function(error) {
            	done(error);
            }).done();
        });
    });
});
