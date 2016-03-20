'use strict'

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var clientUtils = require('../../utils/client')
var commonUtils = require('../../utils/commonUtils')

function test (server) {
  describe('Upsert phrase', function () {
    var AdminClientData = clientUtils.getAdminClient()
    var adminClientToken
    var phraseIds = []

    var phrase = {
      'url': 'published/phrase',
      'get': {
        'code': 'res.status(200).send({ "hello": "World!"});',
        'doc': {

        }
      }
    }

    var invalidPhrase = {
      'url': 'notpublished/phrase',
      'get': {
        'code': 'return res.status(200).send({ "hello": "World!"});'
      }
    }

    before(function (done) {
      this.timeout(30000)
      commonUtils.makeRequest(server, 'post', '/token', AdminClientData, 200)
        .then(function (response) {
          adminClientToken = response.body.data.accessToken
        })
        .should.notify(done)
    })

    after(function (done) {
      this.timeout(30000)
      var promises = phraseIds.map(function (phrase) {
        return commonUtils.makeRequest(server, 'del', phrase, null, 204,
          ['Authorization'], [adminClientToken])
      })

      Promise.all(promises)
        .should.notify(done)
    })

    it('allows to create a wellformed phrase', function (done) {
      this.timeout(30000)
      request(server.app)
        .put('/phrase')
        .set('Authorization', adminClientToken)
        .send(phrase)
        .expect(204)
        .end(function (err, response) {
          expect(response.headers).to.exist
          var brokenPhraseLocation = response.headers.location
          expect(brokenPhraseLocation).to.exist
          phraseIds.push('/phrase/' + phrase.url.replace('/', '!'))
          done(err)
        })
    })

    it('fails creating a badformed phrase', function (done) {
      this.timeout(30000)
      request(server.app)
        .put('/phrase')
        .set('Authorization', adminClientToken)
        .send(invalidPhrase)
        .expect(422)
        .end(function (err, response) {
          expect(response.status).to.equals(422)
          expect(response.body.error).to.equals('error:phrase:validation')
          done(err)
        })
    })

    it('should return an error if the request is made with an incorrect authorization', function (done) {
      request(server.app)
        .put('/phrase')
        .set('Authorization', 'fakeClientToken')
        .send(phrase)
        .expect(401)
        .end(function (err, response) {
          expect(response.body.error).to.equals('error:upsert:phrase')
          done(err)
        })
    })

    it('should return an error if the request is made without authorization', function (done) {
      request(server.app)
        .put('/phrase')
        .send(phrase)
        .expect(401)
        .end(function (err, response) {
          expect(response.body.error).to.equals('missing:header:authorization')
          done(err)
        })
    })
  })
}

module.exports = test
