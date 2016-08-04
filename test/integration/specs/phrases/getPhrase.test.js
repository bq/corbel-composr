'use strict'
/* globals before after describe it */

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var clientUtils = require('../../utils/client')
var commonUtils = require('../../utils/commonUtils')
var connection = require('../../../../src/lib/connectors/corbel')

function test (server) {
  describe('Get phrase', function () {
    this.timeout(30000)
    var AdminClientData = clientUtils.getAdminClient()
    var adminClientToken
    var domain

    var phrase = {
      'url': 'published/phrase',
      'version': '2.2.2',
      'get': {
        'code': 'res.send(200, { "hello": "World!"});',
        'doc': {

        }
      }
    }

    before(function (done) {
      commonUtils.makeRequest(server, 'post', '/token', AdminClientData, 200)
        .then(function (response) {
          adminClientToken = response.body.data.accessToken
          domain = connection.extractDomain(adminClientToken)
          phrase.id = domain + '!published!phrase-2.2.2'
          phrase.urlReplaced = '/phrase/' + phrase.id
          return server.composr.Phrase.register(domain, phrase)
        })
        .should.notify(done)
    })

    after(function () {
      server.composr.Phrase.unregister(domain, phrase.id)
    })

    it('allows to get a phrase', function (done) {
      request(server.app)
        .get(phrase.urlReplaced)
        .set('Authorization', adminClientToken)
        .expect(200)
        .end(function (err, response) {
          expect(response).to.be.an('object')
          expect(response.body.url).to.be.equals(phrase.url)
          expect(response.body.get.code).to.be.equals(phrase.get.code)
          done(err)
        })
    })

    it('should return an error if the request is made with an incorrect authorization', function (done) {
      request(server.app)
        .get(phrase.urlReplaced)
        .set('Authorization', 'fakeClientToken')
        .expect(401)
        .end(function (err, response) {
          expect(response.body.error).to.equals('error:unauthorized')
          done(err)
        })
    })

    it('should return an error if the request is made without authorization', function (done) {
      request(server.app)
        .get(phrase.urlReplaced)
        .expect(401)
        .end(function (err, response) {
          expect(response.body.error).to.equals('missing:header:authorization')
          done(err)
        })
    })
  })
}

module.exports = test
