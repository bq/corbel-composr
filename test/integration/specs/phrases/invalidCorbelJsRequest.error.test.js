'use strict'
/* globals before describe it */

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

function test (server) {
  describe('CorbelJS fails', function () {
    var phraseErrRequest = {
      url: 'error/corbeldriver',
      version: '2.3.4',
      get: {
        code: 'corbelDriver.config.set("urlBase", "https://proxy-qa.bqws.io/v1.0/"); corbelDriver.resources.collection("test").get().then(function(response){ res.status(200).send(response.data); }).catch(function(err){ res.status(err.status).send( err.data);})',
        doc: {}
      }
    }

    before(function (done) {
      server.composr.Phrase
        .register('testDomainComposr', phraseErrRequest)
        .should.be.eventually.fulfilled.and.notify(done)
    })

    it('', function (done) {
      request(server.app)
        .get('/testDomainComposr/error/corbeldriver')
        .set('Authorization', 'eyJ0eXBlIjoiVE9LRU4iLCJjbGllbnRJZCI6IjY0OWYzNDdkIiwic3RhdGUiOiIxNDU1MjgwMjIwMDAwIiwiZG9tYWluSWQiOiJib29xczpudWJpY286ZGVtbyIsInVzZXJJZCI6ImJvb3FzOm51YmljbzpkZW1vOmRlbW90ZXN0MTI6YnEuY29tIiwiZ3JvdXBzIjpbXX0.52ce4a9d05094.kSucuVEUuOCnfhNrC7M8EubG1fI')
        .end(function (err, response) {
          expect(response).to.be.an('object')
          expect(response.body).to.be.a('string')
          done(err)
        })
    })
  })
}

module.exports = test
