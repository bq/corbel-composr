'use strict'

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var corbel = require('corbel-js')
var phraseCacheInvalidate = require('../../../fixtures/phrases/phraseCacheInvalidate.json')
var phraseCacheUser = require('../../../fixtures/phrases/phraseCacheUser.json')
var phraseCacheProfile = require('../../../fixtures/phrases/phraseCacheProfile.json')

function test (server) {
  describe('Cache invalidation between endpoints', function () {
    this.timeout(20000)

    var cachedValueAnonymous, cachedValueUser1, cachedValueUser2, cachedValueClient
    var userAccessToken, userAccessToken2, clientAccessToken

    before(function (done) {
      var optUser = {
        iss: 1,
        aud: 'a',
        userId: 'user1',
        clientId: '66666'
      }

      var optUser2 = {
        iss: 1,
        aud: 'a',
        userId: 'user2',
        clientId: '66666'
      }

      var optClient = {
        iss: 1,
        aud: 'a',
        clientId: '66666'
      }

      userAccessToken = corbel.jwt.generate(optUser, 'asd')
      userAccessToken2 = corbel.jwt.generate(optUser2, 'asd')
      clientAccessToken = corbel.jwt.generate(optClient, 'asd')

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
          .set('Authorization', 'Bearer ' + userAccessToken)
          .expect(200)
          .end(function (err, response) {
            cachedValueUser1 = response.body
            done(err)
          })
      })

      it('returns an example response for anonymous', function (done) {
        request(server.app)
          .get('/cache:domain/cache/user')
          .expect(200)
          .end(function (err, response) {
            cachedValueAnonymous = response.body
            done(err)
          })
      })

      it('returns an example response for client', function (done) {
        request(server.app)
          .get('/cache:domain/cache/user')
          .set('Authorization', 'Bearer ' + clientAccessToken)
          .expect(200)
          .end(function (err, response) {
            cachedValueClient = response.body
            done(err)
          })
      })

      it('requesting again causes the cached response to come back for the user', function (done) {
        request(server.app)
          .get('/cache:domain/cache/user')
          .set('Authorization', 'Bearer ' + userAccessToken)
          .expect(200)
          .end(function (err, response) {
            expect(response.body).to.equals(cachedValueUser1)
            done(err)
          })
      })

      it('requesting with another user gives different response', function (done) {
        request(server.app)
          .get('/cache:domain/cache/user')
          .set('Authorization', 'Bearer ' + userAccessToken2)
          .expect(200)
          .end(function (err, response) {
            expect(response.body).not.to.equals(cachedValueUser1)
            cachedValueUser2 = response.body
            done(err)
          })
      })

      it('requesting again causes the cached response to come back for the user2', function (done) {
        request(server.app)
          .get('/cache:domain/cache/user')
          .set('Authorization', 'Bearer ' + userAccessToken2)
          .expect(200)
          .end(function (err, response) {
            expect(response.body).to.equals(cachedValueUser2)
            done(err)
          })
      })

      it('requesting again causes the cached response to come back for the client', function (done) {
        request(server.app)
          .get('/cache:domain/cache/user')
          .set('Authorization', 'Bearer ' + clientAccessToken)
          .expect(200)
          .end(function (err, response) {
            expect(response.body).to.equals(cachedValueClient)
            done(err)
          })
      })

      it('calling post on the other phrase invalidates the cache (for anonymous user only)', function (done) {
        request(server.app)
          .post('/cache:domain/cache/invalidateusercache')
          .expect(200)
          .end(function (err, response) {
            expect(response.body).to.be.a('string')
            expect(response.body).to.equals('OK')
            done(err)
          })
      })

      it('once invalidated the result is new for anonymous', function (done) {
        request(server.app)
          .get('/cache:domain/cache/user')
          .expect(200)
          .end(function (err, response) {
            expect(response.body).to.be.a('number')
            expect(response.body).to.not.equals(cachedValueAnonymous)
            done(err)
          })
      })

      it('mantains the user cache ok', function (done) {
        request(server.app)
          .get('/cache:domain/cache/user')
          .set('Authorization', 'Bearer ' + userAccessToken)
          .expect(200)
          .end(function (err, response) {
            expect(response.body).to.equals(cachedValueUser1)
            done(err)
          })
      })

      it('calling post on the other phrase invalidates the cache (for the user only)', function (done) {
        request(server.app)
          .post('/cache:domain/cache/invalidateusercache')
          .set('Authorization', 'Bearer ' + userAccessToken)
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
          .set('Authorization', 'Bearer ' + userAccessToken)
          .expect(200)
          .end(function (err, response) {
            expect(response.body).to.be.a('number')
            expect(response.body).to.not.equals(cachedValueUser1)
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
            cachedValueAnonymous = response.body
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
            expect(response.body).to.not.equals(cachedValueAnonymous)
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
