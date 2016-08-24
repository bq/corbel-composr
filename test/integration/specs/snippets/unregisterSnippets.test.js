'use strict'

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

function test (server) {
  var snippetsRegistered

  describe('Unregister multiple snippets', function () {
    var unregisterSnippet1 = {
      name: 'unregisterSnippet1',
      version: '1.2.2',
      codehash: new Buffer('var thing = function(res){ res.send(201, "test"); }; exports(thing);').toString('base64')
    }

    var unregisterSnippet2 = {
      name: 'unregisterSnippet2',
      version: '1.2.2',
      codehash: new Buffer('var thing = function(res,param){res.send(200, param.toUpperCase()); }; exports(thing);').toString('base64')
    }

    var basicPhrase = {
      url: 'unregister-snippet-test',
      version: '1.2.2',
      get: {
        code: 'var mything = require("snippet-unregisterSnippet1"); mything(res);',
        doc: {}
      }
    }

    var upperCasePhrase = {
      url: 'unregister-snippet-test/:name',
      version: '1.2.2',
      get: {
        code: 'var mything = require("snippet-unregisterSnippet2"); mything(res,req.params.name);',
        doc: {}
      }
    }

    before(function (done) {
      this.timeout(30000)
      server.composr.Snippet.register('testDomainComposr',
        [unregisterSnippet1, unregisterSnippet2])
        .should.be.fulfilled
        .then(function (results) {
          snippetsRegistered = results.map(function (res) {
            return res.model
          })
          return server.composr.Phrase.register('testDomainComposr',
            [basicPhrase, upperCasePhrase])
        })
        .should.be.fulfilled.notify(done)
    })

    describe('fails using unregistered snippets', function () {
      this.timeout(30000)
      // Check that both phrases use the snippets
      before(function (done) {
        var promise1 = new Promise(function (resolve, reject) {
          request(server.app)
            .get('/testDomainComposr/unregister-snippet-test')
            .expect(201)
            .end(function (err, response) {
              expect(response).to.be.an('object')
              expect(response.text).to.equals('"test"')
              if (err) {
                reject(err)
              } else {
                resolve()
              }
            })
        })

        var promise2 = new Promise(function (resolve, reject) {
          request(server.app)
            .get('/testDomainComposr/unregister-snippet-test/juan')
            .expect(200)
            .end(function (err, response) {
              expect(response).to.be.an('object')
              expect(response.text).to.equals('"JUAN"')
              if (err) {
                reject(err)
              } else {
                resolve()
              }
            })
        })

        Promise.all([promise1, promise2])
          .should.be.fulfilled
          .then(function () {
            // All has worked as expected, unregister the snippets
            server.composr.Snippet.unregister('testDomainComposr',
              [snippetsRegistered[0].getId(), snippetsRegistered[1].getId()])
            done()
          })
      })

      it('should fail when using an unregistered snippet', function (done) {
        request(server.app)
          .get('/testDomainComposr/unregister-snippet-test')
          .expect(500)
          .end(function (err, response) {
            expect(response.body).to.be.an('object')
            expect(response.body.error).to.equals('error:phrase:exception:unregister-snippet-test')
            done(err)
          })
      })

      it('should fail when using the other unregistered snippet', function (done) {
        request(server.app)
          .get('/testDomainComposr/unregister-snippet-test/juan')
          .expect(500)
          .end(function (err, response) {
            expect(response.body).to.be.an('object')
            expect(response.body.error).to.equals('error:phrase:exception:unregister-snippet-test/:name')
            done(err)
          })
      })
    })
  })
}

module.exports = test
