'use strict'

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var phraseCacheInvalidate = require('../../../fixtures/phrases/phraseCacheInvalidate.json')
var phraseCacheUser = require('../../../fixtures/phrases/phraseCacheUser.json')
var phraseCacheProfile = require('../../../fixtures/phrases/phraseCacheProfile.json')

function test (server) {
  describe('Cache invalidation between endpoints', function () {
    this.timeout(20000)

    var cachedValue

    before(function (done) {
      var phrases = [
        phraseCacheInvalidate, phraseCacheUser, phraseCacheProfile
      ]

      server.composr.Phrase.register('cache:domain', phrases)
        .then(function () {
          done()
        })
    })

    describe('With normal paths', function () {
      it('returns an example response', function (done) {
        request(server.app)
          .get('/cache:domain/cache/user')
          .expect(200)
          .end(function (err, response) {
            cachedValue = response.body
            done(err)
          })
      })

      it('requesting again causes the cached response to come back', function (done) {
        request(server.app)
          .get('/cache:domain/cache/user')
          .expect(200)
          .end(function (err, response) {
            expect(response.body).to.equals(cachedValue)
            done(err)
          })
      })

      it('calling post on the other phrase invalidates the cache', function (done) {
        request(server.app)
          .post('/cache:domain/cache/invalidateusercache')
          .expect(200)
          .end(function (err, response) {
            expect(response.body).to.be.a('string')
            expect(response.body).to.equals('OK')
            done(err)
          })
      })

      it('once invalidated the result is new', function (done) {
        request(server.app)
          .get('/cache:domain/cache/user')
          .expect(200)
          .end(function (err, response) {
            expect(response.body).to.be.a('number')
            expect(response.body).to.not.equals(cachedValue)
            done(err)
          })
      })
    })

    describe('Paths with query parameters', function () {
      var cachedProfileValue
      before(function (done) {
        request(server.app)
          .get('/cache:domain/cache/profile')
          .expect(200)
          .end(function (err, response) {
            cachedProfileValue = response.body
            done(err)
          })
      })

      it('returns an example response', function (done) {
        request(server.app)
          .get('/cache:domain/cache/user?query=pepito')
          .expect(200)
          .end(function (err, response) {
            cachedValue = response.body
            done(err)
          })
      })

      it('calling post on the other phrase invalidates the cache', function (done) {
        request(server.app)
          .post('/cache:domain/cache/invalidateusercache')
          .expect(200)
          .end(function (err, response) {
            expect(response.body).to.be.a('string')
            expect(response.body).to.equals('OK')
            done(err)
          })
      })

      it('once invalidated the result is new', function (done) {
        request(server.app)
          .get('/cache:domain/cache/user?query=pepito')
          .expect(200)
          .end(function (err, response) {
            expect(response.body).to.be.a('number')
            expect(response.body).to.not.equals(cachedValue)
            done(err)
          })
      })

      it('but it has not invalidated the other phrases', function (done) {
        request(server.app)
          .get('/cache:domain/cache/profile')
          .expect(200)
          .end(function (err, response) {
            expect(response.body).to.be.a('number')
            expect(response.body).to.equals(cachedProfileValue)
            done(err)
          })
      })
    })
  })
}

module.exports = test
