'use strict'
/* globals before describe it */

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect

function test (server) {
  describe('When headers are sent', function () {
    var phraseHeaderGet = {
      url: 'headers/:header',
      version: '3.3.3',
      get: {
        code: 'res.status(200).send(req.get(req.params.header))',
        doc: {}
      }
    }

    before(function (done) {
      server.composr.Phrase.register('testDomainComposr', phraseHeaderGet)
        .should.be.eventually.fulfilled.and.notify(done)
    })

    it('returns the correct header with capitalized header name', function (done) {
      request(server.app)
        .get('/testDomainComposr/headers/Deviceid')
        .set('deviceId', 'myDeviceId')
        .expect(200)
        .end(function (err, response) {
          expect(response).to.be.an('object')
          expect(response.body).to.equals('myDeviceId')
          done(err)
        })
    })

    it('does not returns the correct header if asked for uncapitalized', function (done) {
      request(server.app)
        .get('/testDomainComposr/headers/deviceId')
        .set('deviceId', 'myDeviceId')
        .expect(200)
        .end(function (err, response) {
          expect(response).to.be.an('object')
          expect(response.body).not.to.equals('myDeviceId')
          done(err)
        })
    })
  })
}

module.exports = test
