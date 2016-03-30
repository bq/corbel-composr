'use strict'
/* globals before describe it */

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var clientUtils = require('../../utils/client')
var commonUtils = require('../../utils/commonUtils')
var connection = require('../../../../src/lib/corbelConnection')
var domain

function test (server) {
  describe('Delete phrase', function () {
    this.timeout(30000)
    var AdminClientData = clientUtils.getAdminClient()
    var adminClientToken
    var phrase = {
      'url': 'published/phrase',
      'version': '2.3.4',
      'get': {
        'code': 'res.status(200).send({ "hello": "World!"});',
        'doc': {

        }
      }
    }

    before(function (done) {
      commonUtils.makeRequest(server, 'post', '/token', AdminClientData, 200)
        .then(function (response) {
          adminClientToken = response.body.data.accessToken
          domain = connection.extractDomain(adminClientToken)
          return commonUtils.makeRequest(server, 'put', '/phrase', phrase, 200,
            ['Authorization'], [adminClientToken])
        })
        .should.notify(done)
    })

    it('should return an error if the request is made with an incorrect authorization', function (done) {
      request(server.app)
        .del('/phrase/' + domain + '!published!phrase-2.3.4')
        .set('Authorization', 'fakeClientToken')
        .expect(401)
        .end(function (err, response) {
          expect(response.body.error).to.equals('error:delete:phrase')
          done(err)
        })
    })

    it('should return an error if the request is made without authorization', function (done) {
      request(server.app)
        .del('/phrase/' + domain + '!published!phrase-2.3.4')
        .expect(401)
        .end(function (err, response) {
          expect(response.body.error).to.equals('missing:header:authorization')
          done(err)
        })
    })

    it('allows to delete a phrase', function (done) {
      request(server.app)
        .del('/phrase/' + domain + '!published!phrase-2.3.4')
        .set('Authorization', adminClientToken)
        .expect(204)
        .end(function (err, response) {
          expect(response.status).to.equals(204)
          done(err)
        })
    })
  })
}

module.exports = test
