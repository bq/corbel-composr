'use strict'

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect

function test (server) {
  describe('The status endpoint', function () {
    it('returns some check statuses in the status page', function (done) {
      request(server.app)
        .get('/status')
        .expect(200)
        .end(function (error, response) {
          expect(response.body).to.be.an('object')
          expect(response.body).to.include.keys(
            'env',
            'domains',
            'version',
            'statuses',
            'corbel',
            'redis'
          )
          expect(response.body.statuses.phrasesLoaded).to.be.a('number')
          done(error)
        })
    })

    it('returns some check statuses in the healthcheck page', function (done) {
      request(server.app)
        .get('/healthcheck')
        .end(function (error, response) {
          expect(response.body).to.be.an('object')
          expect(response.body).to.include.keys(
            'env',
            'domains',
            'version',
            'statuses',
            'corbel',
            'redis'
          )
          expect(response.body.statuses.phrasesLoaded).to.be.a('number')
          done(error)
        })
    })

    it('returns corbel-js and composr-core version', function (done) {
      request(server.app)
        .get('/version')
        .expect(200)
        .end(function (error, response) {
          expect(response.body).to.be.an('object')
          expect(response.body).to.include.keys(
            'corbel-js',
            'composr-core',
            'version',
            'name'
          )
          done(error)
        })
    })
  })
}

module.exports = test
