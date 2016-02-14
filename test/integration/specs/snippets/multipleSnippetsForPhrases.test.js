'use strict'
/* globals before describe it */

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

function test (server) {
  describe('Describe phrases execution with snippets', function () {
    var basicSnippet = {
      id: 'testDomainComposr!basicSnippet',
      codehash: new Buffer('var thing = function(res){ res.status(201).send("test"); }; exports(thing);').toString('base64')
    }

    var basicPhrase = {
      url: 'snippet-test',
      get: {
        code: 'var mything = require("snippet-basicSnippet"); mything(res);',
        doc: {}
      }
    }

    var upperCaseSnippet = {
      id: 'testDomainComposr!upperCaseSnippet',
      codehash: new Buffer('var thing = function(res,param){res.status(200).send(param.toUpperCase()); }; exports(thing);').toString('base64')
    }

    var upperCasePhrase = {
      url: 'snippet-test/:name',
      get: {
        code: 'var mything = require("snippet-upperCaseSnippet"); mything(res,req.params.name);',
        doc: {}
      }
    }

    var awesomenizerSnippet = {
      id: 'testDomainComposr!awesomenizerSnippet',
      codehash: new Buffer('var thing = function(param){return param + " is awesome!"; }; exports(thing);').toString('base64')
    }

    var awesomenizerPhrase = {
      url: 'snippet-test/awesome/:name',
      get: {
        code: 'var upper = require("snippet-upperCaseSnippet"); ' +
          'var awesomenizer = require("snippet-awesomenizerSnippet"); ' +
          'upper(res,awesomenizer(req.params.name));',
        doc: {}
      }
    }

    before(function (done) {
      server.composr.Snippets.register('testDomainComposr',
        [basicSnippet, upperCaseSnippet, awesomenizerSnippet])
        .should.be.eventually.fulfilled
        .then(function () {
          return server.composr.Phrases.register('testDomainComposr',
            [basicPhrase, upperCasePhrase, awesomenizerPhrase])
            .should.be.eventually.fulfilled
        })
        .then(function () {
          done()
        })
    })

    it('a phrase should can use a basic snippet', function (done) {
      request(server.app)
        .get('/testDomainComposr/snippet-test')
        .expect(201)
        .end(function (err, response) {
          expect(response).to.be.an('object')
          expect(response.text).to.equals('"test"')
          done(err)
        })
    })

    it('the result of a phrase have been altered by a snippet', function (done) {
      request(server.app)
        .get('/testDomainComposr/snippet-test/juan')
        .expect(200)
        .end(function (err, response) {
          expect(response).to.be.an('object')
          expect(response.text).to.equals('"JUAN"')
          done(err)
        })
    })

    it('a phrase should can use multiple snippets simultaneously', function (done) {
      request(server.app)
        .get('/testDomainComposr/snippet-test/awesome/juan')
        .expect(200)
        .end(function (err, response) {
          expect(response).to.be.an('object')
          expect(response.text).to.equals('"JUAN IS AWESOME!"')
          done(err)
        })
    })
  })
}

module.exports = test
