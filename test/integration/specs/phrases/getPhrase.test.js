'use strict'

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var clientUtils = require('../../utils/client')
var commonUtils = require('../../utils/commonUtils')
var connection = require('../../../../src/lib/corbelConnection')

function test (server) {
  describe('Get phrase', function () {
    var AdminClientData = clientUtils.getAdminClient()
    var adminClientToken
    var domain
    var phrases = []

    var phrase = {
      'url': 'published/phrase',
      'get': {
        'code': 'res.status(200).send({ "hello": "World!"});',
        'doc': {

        }
      }
    }

    before(function (done) {
      this.timeout(30000)
      commonUtils.makeRequest(server, 'post', '/token', AdminClientData, 200)
        .then(function (response) {
          adminClientToken = response.body.data.accessToken
          domain = connection.extractDomain(adminClientToken)
          phrase.id = server.composr.Phrases._generateId(phrase.url, domain)
          phrase.urlReplaced = '/phrase/' + phrase.url.replace('/', '!')
          phrases.push(phrase)
          return server.composr.Phrases.register(domain, phrase)
        })
        .should.notify(done)
    })

    after(function (done) {
      this.timeout(30000)
      var promises = phrases.map(function (phrase) {
        return server.composr.removePhrasesFromDataStructure(phrase.id)
      })

      Promise.all(promises)
        .should.notify(done)
    })

    it('allows to get a phrase', function (done) {
      this.timeout(30000)
      request(server.app)
        .get(phrases[0].urlReplaced)
        .set('Authorization', adminClientToken)
        .expect(200)
        .end(function (err, response) {
          expect(response).to.be.an('object')
          expect(response.body.url).to.be.equals(phrase.url)
          expect(response.body.codes.get.code).to.be.equals(phrase.get.code)
          done(err)
        })
    })

    it('should return an error if the request is made with an incorrect authorization', function (done) {
      request(server.app)
        .get(phrases[0].urlReplaced)
        .set('Authorization', 'fakeClientToken')
        .expect(401)
        .end(function (err, response) {
          expect(response.body.error).to.equals('error:unauthorized')
          done(err)
        })
    })

    it('should return an error if the request is made without authorization', function (done) {
      request(server.app)
        .get(phrases[0].urlReplaced)
        .expect(401)
        .end(function (err, response) {
          expect(response.body.error).to.equals('missing:header:authorization')
          done(err)
        })
    })
  })
}

module.exports = test
