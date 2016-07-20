'use strict'

var request = require('supertest')
var corbel = require('corbel-js')
var chai = require('chai')
var expect = chai.expect
var phraseCache = require('../../../fixtures/phrases/cachedPhrase.json')

function test (server) {
  describe('Cached phrase', function () {
    this.timeout(20000)

    var previousDate

    before(function (done) {
      var phrases = [
        phraseCache
      ]

      server.composr.Phrase.register('cache:domain', phrases)
        .then(function (results) {
          request(server.app)
            .post('/cache:domain/cache/test')
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
        .get('/cache:domain/cache/test')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.be.a('number')
          previousDate = response.body
          done(err)
        })
    })

    it('requesting again causes the cached response to come back', function (done) {
      request(server.app)
        .get('/cache:domain/cache/test')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.be.a('number')
          expect(response.body).to.equals(previousDate)
          done(err)
        })
    })

    it('calling post invalidates the cache', function (done) {
      request(server.app)
        .post('/cache:domain/cache/test')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.be.a('string')
          expect(response.body).to.equals('OK')
          done(err)
        })
    })

    it('once invalidated the result is new', function (done) {
      request(server.app)
        .get('/cache:domain/cache/test')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.be.a('number')
          expect(response.body).to.not.equals(previousDate)
          done(err)
        })
    })

    describe('For different users and clients', function () {
      var userAccessToken, userAccessToken2, clientAccessToken
      var responseUser1, responseUser2, responseClient

      function requestCache (token) {
        return new Promise(function (resolve, reject) {
          request(server.app)
            .get('/cache:domain/cache/test')
            .set('Authorization', 'Bearer ' + token)
            .end(function (err, response) {
              if (err) {
                reject(err)
              } else {
                resolve(response.body)
              }
            })
        })
      }

      before(function (done) {
        var optUser = {
          iss: 1,
          aud: 'a',
          userId: 'user1'
        }

        var optUser2 = {
          iss: 1,
          aud: 'a',
          userId: 'user2'
        }

        var optClient = {
          iss: 1,
          aud: 'a',
          clientId: '54313'
        }

        userAccessToken = corbel.jwt.generate(optUser, 'asd')
        userAccessToken2 = corbel.jwt.generate(optUser2, 'asd')
        clientAccessToken = corbel.jwt.generate(optClient, 'asd')

        var promise1 = requestCache(userAccessToken)
          .then(function (response) {
            responseUser1 = response
          })

        var promise2 = requestCache(userAccessToken2)
          .then(function (response) {
            responseUser2 = response
          })

        var promise3 = requestCache(clientAccessToken)
          .then(function (response) {
            responseClient = response
          })

        Promise.all([promise1, promise2, promise3])
          .then(function () {
            expect(responseUser1).to.not.equals(responseUser2)
            expect(responseClient).to.not.equals(responseUser1)
            expect(responseClient).to.not.equals(responseUser2)
            done()
          })
          .catch(done)
      })

      it('Returns the same response for the user 1', function (done) {
        requestCache(userAccessToken)
          .then(function (data) {
            expect(data).to.equals(responseUser1)
            done()
          })
      })

      it('Returns the same response for the user2', function (done) {
        requestCache(userAccessToken2)
          .then(function (data) {
            expect(data).to.equals(responseUser2)
            done()
          })
      })

      it('Returns the same response for the client', function (done) {
        requestCache(clientAccessToken)
          .then(function (data) {
            expect(data).to.equals(responseClient)
            done()
          })
      })

      it('Returns the same response for the client', function (done) {
        requestCache(clientAccessToken)
          .then(function (data) {
            expect(data).to.equals(responseClient)
            done()
          })
      })
    })
  })
}

module.exports = test
