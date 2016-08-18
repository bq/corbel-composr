'use strict'

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var phraseCache = {
  'url': 'cache/expiry',
  'version': '2.3.3',
  'get': {
    'code': 'res.send(200, Date.now())',
    'cache': {
      'type': 'user',
      'duration': '2s'
    },
    'middlewares': [
      'cache'
    ],
    'doc': {
      'description': 'Phrase for testing purposes'
    }
  }
}

function test (server) {
  describe('Cached timeout phrase', function () {
    this.timeout(20000)

    var previousDate

    before(function (done) {
      var phrases = [
        phraseCache
      ]

      server.composr.Phrase.register('some:cache:domain', phrases)
        .then(function () {
          done()
        })
    })

    it('returns an example response', function (done) {
      request(server.app)
        .get('/some:cache:domain/cache/expiry')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.be.a('number')
          previousDate = response.body
          done(err)
        })
    })

    it('requesting again causes the cached response to come back', function (done) {
      request(server.app)
        .get('/some:cache:domain/cache/expiry')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.be.a('number')
          expect(response.body).to.equals(previousDate)
          done(err)
        })
    })

    it('once expired the result is new', function (done) {
      setTimeout(function () {
        request(server.app)
          .get('/some:cache:domain/cache/expiry')
          .expect(200)
          .end(function (err, response) {
            expect(response.body).to.be.a('number')
            expect(response.body).to.not.equals(previousDate)
            done(err)
          })
      }, 2000)
    })
  })
}

module.exports = test
