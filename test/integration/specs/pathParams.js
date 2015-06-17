'use strict';
var request = require('supertest'),
  regexpGenerator = require('../../../src/lib/regexpGenerator.js'),
  phraseManager = require('../../../src/lib/phraseManager.js'),
  chai = require('chai'),
  sinon = require('sinon'),
  expect = chai.expect;


function test(app) {
  describe('Path params', function() {
    describe('Integration test for path params', function() {
      var domain = 'test';
      var stub;

      var phrases = [
        /*{
        url: '',
        callee: '',
        test: {}
      },*/
        {
          url: ':param',
          callee: 'hola',
          test: {
            param: 'hola'
          }
        }, /*{ //TODO ALLOW EMPTY CALLEES
          url: ':param?',
          callee: '',
          test: {
            param: null
          }
        }*/ {
          url: ':param?',
          callee: 'asd',
          test: {
            param: 'asd'
          }
        }, {
          url: 'logoutuser/:type?',
          callee: 'logoutuser/',
          test: {
            type: null
          }
        }, {
          url: 'logoutuser/:type?',
          callee: 'logoutuser/all',
          test: {
            type: 'all'
          }
        }, {
          url: 'pepito',
          callee: 'pepito',
          test: {}
        }, {
          url: 'test/:arg/:arg2',
          callee: 'test/hola/mundo',
          test: {
            arg: 'hola',
            arg2: 'mundo'
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

      before(function() {
        phrases = phrases.map(function(phrase) {
          phrase.get = {
            code: 'console.log(req.params); res.send(req.params);'
          };
          phrase.regexpReference = regexpGenerator.regexpReference(phrase.url);
          return phrase;
        });
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