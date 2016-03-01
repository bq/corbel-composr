'use strict'

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var clientUtils = require('../../utils/client')
var commonUtils = require('../../utils/commonUtils')

function test (server) {
  describe('Delete snippet', function () {
    var codehash = 'var userModel = function(id){ this.id = id; }; exports(userModel);'
    var snippetId = 'testDomainComposr!valid'
    var AdminClientData = clientUtils.getAdminClient()
    var adminClientToken
    var validSnippet = {
      id: snippetId,
      codehash: server.composr.utils.encodeToBase64(codehash)
    }

    before(function (done) {
      this.timeout(30000)
      commonUtils.makeRequest(server, 'post', '/token', AdminClientData, 200)
        .then(function (response) {
          adminClientToken = response.body.data.accessToken

          return commonUtils.makeRequest(server, 'put', '/snippet', validSnippet, 204,
            ['Authorization'], [adminClientToken])
        })
        .should.notify(done)
    })

    it('allows to delete a snippet', function (done) {
      this.timeout(30000)
      request(server.app)
        .del('/snippet/' + snippetId)
        .set('Authorization', adminClientToken)
        .expect(204)
        .end(function (err, response) {
          expect(response.statusCode).to.equals(204)
          done(err)
        })
    })

    it('should return an error if the request is made with an incorrect authorization', function (done) {
      request(server.app)
        .del('/snippet/' + snippetId)
        .set('Authorization', 'fakeClientToken')
        .expect(401)
        .end(function (err, response) {
          expect(response.body.error).to.equals('error:snippet:delete')
          done(err)
        })
    })

    it('should return an error if the request is made without authorization', function (done) {
      request(server.app)
        .del('/snippet/' + snippetId)
        .expect(401)
        .end(function (err, response) {
          expect(response.body.error).to.equals('missing:header:authorization')
          done(err)
        })
    })
  })
}

module.exports = test
