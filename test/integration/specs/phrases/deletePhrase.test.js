'use strict'
/* globals before describe it */

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var clientUtils = require('../../utils/client')
var commonUtils = require('../../utils/commonUtils')

function test (server) {
  describe('Delete phrase', function () {
    var AdminClientData = clientUtils.getAdminClient()
    var adminClientToken
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

          return commonUtils.makeRequest(server, 'put', '/phrase', phrase, 204,
            ['Authorization'], [adminClientToken])
        })
        .should.notify(done)
    })

    it('allows to delete a phrase', function (done) {
      this.timeout(30000)
      request(server.app)
        .del('/phrase/' + phrase.url.replace('/', '!'))
        .set('Authorization', adminClientToken)
        .expect(204)
        .end(function (err, response) {
          expect(response.status).to.equals(204)
          done(err)
        })
    })

    it('should return an error if the request is made with an incorrect authorization', function (done) {
      request(server.app)
        .del('/phrase/' + phrase.url.replace('/', '!'))
        .set('Authorization', 'fakeClientToken')
        .expect(401)
        .end(function (err, response) {
          expect(response.body.error).to.equals('error:phrase:delete')
          done(err)
        })
    })

    it('should return an error if the request is made without authorization', function (done) {
      request(server.app)
        .del('/phrase/' + phrase.url.replace('/', '!'))
        .expect(401)
        .end(function (err, response) {
          expect(response.body.error).to.equals('missing:header:authorization')
          done(err)
        })
    })
  })
}

module.exports = test
