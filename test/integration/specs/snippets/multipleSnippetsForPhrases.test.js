'use strict'

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

function test (server) {
  describe('Describe phrases execution with snippets', function () {
    var basicSnippet = {
      name: 'basicSnippet',
      version: '3.3.3',
      codehash: new Buffer('var thing = function(res){ res.send(200, "test"); }; exports(thing);').toString('base64')
    }

    var basicPhrase = {
      url: 'snippet-test',
      version: '3.3.3',
      get: {
        code: 'var mything = require("snippet-basicSnippet"); mything(res);',
        doc: {}
      }
    }

    var upperCaseSnippet = {
      name: 'upperCaseSnippet',
      version: '3.3.3',
      codehash: new Buffer('var thing = function(res,param){res.send(200, param.toUpperCase()); }; exports(thing);').toString('base64')
    }

    var upperCaseSnippet_bugged = {
      name: 'upperCaseSnippet',
      version: '3.5.5',
      codehash: new Buffer('var thing = function(res,param){res.send(200, param.toLowerCase()); }; exports(thing);').toString('base64')
    }

    var upperCasePhrase = {
      url: 'uppercase/:name',
      version: '3.3.3',
      get: {
        code: 'var mything = require("snippet-upperCaseSnippet"); mything(res,req.params.name);',
        doc: {}
      }
    }

    var upperCasePhrase_bugged = {
      url: 'uppercase/:name',
      version: '3.5.5',
      get: {
        code: 'var mything = require("snippet-upperCaseSnippet"); mything(res,req.params.name);',
        doc: {}
      }
    }

    var awesomenizerSnippet = {
      name: 'awesomenizerSnippet',
      version: '3.3.3',
      codehash: new Buffer('var thing = function(param){return param + " is awesome!"; }; exports(thing);').toString('base64')
    }

    var awesomenizerPhrase = {
      url: 'snippet-test/awesome/:name',
      version: '3.3.3',
      get: {
        code: 'var upper = require("snippet-upperCaseSnippet"); ' +
          'var awesomenizer = require("snippet-awesomenizerSnippet"); ' +
          'upper(res,awesomenizer(req.params.name));',
        doc: {}
      }
    }

    before(function (done) {
      server.composr.Snippet.register('testDomainComposr',
        [basicSnippet, upperCaseSnippet, upperCaseSnippet_bugged, awesomenizerSnippet])
        .should.be.eventually.fulfilled
        .then(function () {
          return server.composr.Phrase.register('testDomainComposr',
            [basicPhrase, upperCasePhrase, upperCasePhrase_bugged, awesomenizerPhrase])
            .should.be.eventually.fulfilled
        })
        .then(function () {
          done()
        })
    })

    it('a phrase should can use a basic snippet', function (done) {
      request(server.app)
        .get('/testDomainComposr/snippet-test')
        .expect(200)
        .end(function (err, response) {
          expect(response).to.be.an('object')
          expect(response.text).to.equals('"test"')
          done(err)
        })
    })

    it('the result of a phrase have been altered by a snippet', function (done) {
      request(server.app)
        .get('/testDomainComposr/uppercase/juan')
        .set('Accept-Version', '3.3.3')
        .expect(200)
        .end(function (err, response) {
          expect(response).to.be.an('object')
          expect(response.text).to.equals('"JUAN"')
          done(err)
        })
    })

    it('the result of a phrase have been altered by a snippet, with other version', function (done) {
      request(server.app)
        .get('/testDomainComposr/uppercase/juan')
        .set('Accept-Version', '3.5.5')
        .expect(200)
        .end(function (err, response) {
          expect(response).to.be.an('object')
          expect(response.text).to.equals('"juan"')
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
