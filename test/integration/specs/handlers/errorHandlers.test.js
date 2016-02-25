'use strict'
/* globals before describe it */

var request = require('supertest')
var sinon = require('sinon')
var chai = require('chai')
var expect = chai.expect

function test (server) {
  describe('When a request to composr has errors', function () {
    var errorPhrase401 = {
      url: 'error/401',
      get: {
        code: 'res.status(401).send("test")',
        doc: {}
      }
    }

    var errorPhrase500 = {
      url: 'error/500',
      get: {
        code: 'throw( { error: "internal_server_error", errorDescription: "error 500 thrown"})',
        doc: {}
      }
    }

    var errorWithText = {
      url: 'error/text',
      get: {
        code: 'throw("Error thrown")',
        doc: {}
      }
    }

    var composrErrorPhrase = {
      url: 'error/composr/506',
      get: {
        code: 'var ComposrError = require("ComposrError"); throw new ComposrError("test", "errorDescription", 506)',
        doc: {}
      }
    }

    before(function (done) {
      var phrases = [
        errorPhrase401,
        errorPhrase500,
        errorWithText,
        composrErrorPhrase
      ]

      server.composr.Phrases.register('testDomainComposr', phrases)
        .should.be.eventually.fulfilled.and.notify(done)
    })

    it('it fails with a 500 error', function (done) {
      var stub = sinon.stub()
      server.hub.on('http:end', stub)
      request(server.app)
        .get('/e1')
        .expect(500)
        .end(function (err, response) {
          if (err) {
            throw err
          }
          expect(response).to.be.an('object')
          expect(stub.callCount).to.equals(1)
          done()
        })
    })

    it('it fails with a 555 error with e2', function (done) {
      request(server.app)
        .get('/e2')
        .expect(555)
        .end(function (err, response) {
          if (err) {
            throw err
          }
          expect(response).to.be.an('object')
          expect(response.body.error).to.be.equals('error:custom')
          done()
        })
    })

    it('it fails with a 401 sent by the user', function (done) {
      var stub = sinon.stub()
      server.hub.on('http:end', stub)

      request(server.app)
        .get('/testDomainComposr/error/401')
        .expect(401)
        .end(function (err, response) {
          if (err) {
            throw err
          }
          expect(stub.callCount).to.equals(1)
          expect(response.body).to.be.equals('test')
          done()
        })
    })

    it('it parses a error with an error key throwing a 500 error', function (done) {
      var stub = sinon.stub()
      server.hub.on('http:end', stub)

      request(server.app)
        .get('/testDomainComposr/error/500')
        .expect(500)
        .end(function (err, response) {
          if (err) {
            throw err
          }
          expect(response).to.be.an('object')
          expect(response.body.error).to.be.equals('internal_server_error')
          expect(response.body.errorDescription).to.be.equals('error 500 thrown')
          expect(response.body.status).to.be.equals(500)
          expect(stub.callCount).to.equals(1)
          done()
        })
    })

    it('it returns a 500 error if the phrase throws a single string', function (done) {
      var errorDescription = 'Error thrown'

      request(server.app)
        .get('/testDomainComposr/error/text')
        .expect(500)
        .end(function (err, response) {
          if (err) {
            throw err
          }
          expect(response).to.be.an('object')
          expect(response.body.error).to.be.equals('error:phrase:exception:error/text')
          expect(response.body.errorDescription).to.be.deep.equals(errorDescription)
          expect(response.body.status).to.be.deep.equals(500)
          done()
        })
    })

    it('bypasses ComposrErrors', function (done) {
      request(server.app)
        .get('/testDomainComposr/error/composr/506')
        .expect(506)
        .end(function (err, response) {
          if (err) {
            throw err
          }
          expect(response).to.be.an('object')
          expect(response.body.error).to.be.equals('test')
          expect(response.body.errorDescription).to.be.equals('errorDescription')
          expect(response.body.status).to.be.deep.equals(506)
          done()
        })
    })
  })
}

module.exports = test
