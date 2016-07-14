'use strict'

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var phraseCache = require('../../../fixtures/phrases/cachedPhrase.json')

function test (server) {
  describe('Cached phrase', function () {
    var previousDate

    before(function (done) {
      var phrases = [
        phraseCache
      ]

      server.composr.Phrase.register('cache:domain', phrases)
        .then(function (results) {
          done()
        })
    })

    it('returns an example response', function (done) {
      request(server.app)
        .get('/cache:domain/cache')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.be.a('number')
          previousDate = response.body
          console.log(previousDate)
          done(err)
        })
    })

    it('requesting again causes the cached response to come back', function (done) {
      request(server.app)
        .get('/cache:domain/cache')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.be.a('number')
          previousDate = response.body
          console.log(previousDate)
          done(err)
        })
    })

    it('calling post invalidates the cache', function (done) {
      request(server.app)
        .post('/cache:domain/cache')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.be.a('string')
          previousDate = response.body
          console.log(previousDate)
          done(err)
        })
    })

    it('once invalidated the result is new', function (done) {
      request(server.app)
        .get('/cache:domain/cache')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.be.a('number')
          previousDate = response.body
          console.log(previousDate)
          done(err)
        })
    })
  })
}

module.exports = test
