'use strict'

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var phraseCache = require('../../../fixtures/phrases/cachedPhrase.json')
var hub = require('../../../../src/lib/hub')

function test (server) {
  describe('Cached phrase', function () {
    this.timeout(20000)
    console.log(hub)

    var previousDate

    before(function (done) {
      var phrases = [
        phraseCache
      ]

      server.composr.Phrase.register('cache:domain', phrases)
        .then(function (results) {
          request(server.app)
            .post('/cache:domain/cache')
            .expect(200)
            .end(function (err, response) {
              expect(response.body).to.be.a('string')
              expect(response.body).to.equals('OK')
              done(err)
            })
        })
    })

    it('returns an example response', function (done) {
      request(server.app)
        .get('/cache:domain/cache')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.be.a('number')
          previousDate = response.body
          done(err)
        })
    })

    it('requesting again causes the cached response to come back', function (done) {
      request(server.app)
        .get('/cache:domain/cache')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.be.a('number')
          expect(response.body).to.equals(previousDate)
          done(err)
        })
    })

    it('calling post invalidates the cache', function (done) {
      request(server.app)
        .post('/cache:domain/cache')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.be.a('string')
          expect(response.body).to.equals('OK')
          done(err)
        })
    })

    it('once invalidated the result is new', function (done) {
      request(server.app)
        .get('/cache:domain/cache')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.be.a('number')
          expect(response.body).to.not.equals(previousDate)
          done(err)
        })
    })
  })
}

module.exports = test
