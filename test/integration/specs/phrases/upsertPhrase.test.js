'use strict'
/* globals before after describe it */

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var clientUtils = require('../../utils/client')
var commonUtils = require('../../utils/commonUtils')
var connection = require('../../../../src/lib/corbelConnection')

function test (server) {
  describe('Upsert phrase', function () {
    this.timeout(30000)

    var AdminClientData = clientUtils.getAdminClient()
    var adminClientToken
    var domain

    var phrase = {
      'url': 'published/phrase',
      'version': '2.2.2',
      'get': {
        'code': 'res.status(200).send({ "hello": "World!"});',
        'doc': {

        }
      }
    }

    var invalidPhrase = {
      'url': 'notpublished/phrase',
      'version': '2.2.2',
      'get': {
        'code': 'return res.status(200).send({ "hello": "World!"});'
      }
    }

    before(function (done) {
      commonUtils.makeRequest(server, 'post', '/token', AdminClientData, 200)
        .then(function (response) {
          adminClientToken = response.body.data.accessToken
          domain = connection.extractDomain(adminClientToken)
        })
        .should.notify(done)
    })

    after(function (done) {
      var promises = [domain + '!published!phrase-2.2.2'].map(function (id) {
        return commonUtils.makeRequest(server, 'del', '/phrase/' + id, null, 204,
          ['Authorization'], [adminClientToken])
      })

      Promise.all(promises)
        .should.notify(done)
    })

    it('allows to create a wellformed phrase', function (done) {
      request(server.app)
        .put('/phrase')
        .set('Authorization', adminClientToken)
        .send(phrase)
        .expect(200)
        .end(function (err, response) {
          expect(response.headers).to.exist
          var goodPhraseLocation = response.headers.location
          expect(goodPhraseLocation).to.exist

          // Hijack the register in order not to depend on rabbit for travis
          server.composr.Phrase.register(domain, phrase)
            .then(function () {
              done(err)
            })
        })
    })

    it('fails creating a badformed phrase', function (done) {
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
