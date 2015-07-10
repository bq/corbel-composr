'use strict';
var request = require('supertest'),
  regexpGenerator = require('../../../src/lib/regexpGenerator.js'),
  phraseManager = require('../../../src/lib/phraseManager.js'),
  chai = require('chai'),
  sinon = require('sinon'),
  expect = chai.expect;


function test(app) {
  describe('Query params', function() {
    describe('Integration test for query params', function() {
      var domain = 'test';
      var stub;

      var phrases = [{
        url: ':param',
        callee: 'hola?user=pepe',
        test: {
          user: 'pepe'
        }
      }, {
        url: ':param?',
        callee: 'asd?casa=roja&moto=verde',
        test: {
          casa: 'roja',
          moto: 'verde'
        }
      }, {
        url: 'logoutuser/:type?',
        callee: 'logoutuser?casa=roja&moto=verde',
        test: {
          casa: 'roja',
          moto: 'verde'
        }
      }, {
        url: 'pepito',
        callee: 'pepito?hola=mundo',
        test: {
          hola: 'mundo'
        }
      }];

      var PHRASE_INDEX = 0;

      before(function() {
        phrases = phrases.map(function(phrase) {
          phrase.get = {
            code: 'res.send(req.query);'
          };
          phrase.regexpReference = regexpGenerator.regexpReference(phrase.url);
          phraseManager.cacheMethods(phrase);
          return phrase;
        });
      });

      after(function() {
        stub.restore();
      });

      function executeTest(cb) {
        var phrase = phrases[PHRASE_INDEX];

        stub = sinon.stub(phraseManager, 'getPhraseByMatchingPath', function() {
          return this;
        }.bind(phrase));

        request(app)
          .get('/mydomain/' + phrase.callee)
          .expect(200)
          .end(function(err, response) {

            Object.keys(phrase.test).forEach(function(key) {
              expect(phrase.test[key]).to.equals(response.body[key]);
            })

            if (PHRASE_INDEX < phrases.length - 1) {
              PHRASE_INDEX++
              stub.restore();
              executeTest(cb);
            } else {
              cb();
            }
          })

      }

      it('does receive all the query params as expected', function(done) {
        this.timeout(30000);
        executeTest(done);
      });

    });


    describe('corbel-js search query params', function() {
      var domain = 'test';
      var stub;

      var phrases = [{
        url: ':moto',
        callee: 'moto?query=[{\"$eq\":{\"titleText\": \"Praga De cerca 3\"}}]',
        test: {
          query: {
            type: 'string',
            value: "[{'$eq': { 'titleText': 'Praga De cerca 3' } }]"
          }
        }
      }];

      var PHRASE_INDEX = 0;

      before(function() {
        phrases = phrases.map(function(phrase) {
          phrase.get = {
            code: 'res.send(req.query);'
          };
          phrase.regexpReference = regexpGenerator.regexpReference(phrase.url);
          phraseManager.cacheMethods(phrase);
          return phrase;
        });
      });

      after(function() {
        stub.restore();
      });

      function executeTest(cb) {
        var phrase = phrases[PHRASE_INDEX];

        stub = sinon.stub(phraseManager, 'getPhraseByMatchingPath', function() {
          return this;
        }.bind(phrase));

        request(app)
          .get('/mydomain/' + phrase.callee)
          .expect(200)
          .end(function(err, response) { 
            console.log(response.body);

            Object.keys(phrase.test).forEach(function(key) {
              var typeofParam = typeof(response.body[key]);
              expect(phrase.test[key].type).to.equals(typeofParam);
            })

            if (PHRASE_INDEX < phrases.length - 1) {
              PHRASE_INDEX++
              stub.restore();
              executeTest(cb);
            } else {
              cb();
            }
          })

      }

      it('does receive all the query params as expected', function(done) {
        this.timeout(30000);
        executeTest(done);
      });

    });
  });
}

module.exports = test;