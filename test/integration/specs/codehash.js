'use strict';
var request = require('supertest'),
  regexpGenerator = require('../../../src/lib/regexpGenerator.js'),
  phraseManager = require('../../../src/lib/phraseManager.js'),
  chai = require('chai'),
  sinon = require('sinon'),
  expect = chai.expect;


function test(app) {
  describe('Base 64 code', function() {
    describe('Integration test checking the base64 code evaluation', function() {
      var domain = 'test';
      var stub;

      var phrases = [
        {
          url: ':param',
          callee: 'hola',
          test: {
            param: 'hola'
          }
        }, {
          url: 'test/:arg/:optional?',
          callee: 'test/hola',
          test: {
            arg: 'hola',
            optional: null
          }
        }, {
          url: 'test/:arg/:optional?',
          callee: 'test/hola/mundo',
          test: {
            arg: 'hola',
            optional: 'mundo'
          }
        }, {
          url: 'user/:optional?/:arg/name',
          callee: 'user/hey/name',
          test: {
            optional: null,
            arg: 'hey'
          }
        }, {
          url: 'user/:optional?/:arg/name',
          callee: 'user/hey/ho/name',
          test: {
            optional: 'hey',
            arg: 'ho'
          }
        }
      ];

      var PHRASE_INDEX = 0;
      var code = 'res.send(req.params)';
      var codehash = new Buffer(code).toString('base64');

      before(function() {
        phrases = phrases.map(function(phrase) {
          phrase.get = {
            codehash: codehash
          };
          phrase.regexpReference = regexpGenerator.regexpReference(phrase.url);
          phraseManager.cacheMethods(phrase);
          return phrase;
        });
      });

      after(function(){
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
            
            Object.keys(response.body).forEach(function(key) {
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

      it('does receive all the path params as expected', function(done) {
        this.timeout(30000);
        executeTest(done);
      })



    });
  });
}

module.exports = test;