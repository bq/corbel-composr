'use strict'
/* globals before describe it */

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var clientUtils = require('../../utils/client')
var commonUtils = require('../../utils/commonUtils')
var connection = require('../../../../src/lib/corbelConnection')

function test (server) {
  describe('Delete snippet', function () {
    var code = 'var userModel = function(id){ this.id = id; }; exports(userModel);'
    var domain
    var AdminClientData = clientUtils.getAdminClient()
    var adminClientToken
    var validSnippet = {
      name: 'valid',
      version: '2.3.3',
      codehash: server.composr.utils.encodeToBase64(code)
    }

    before(function (done) {
      this.timeout(30000)
      commonUtils.makeRequest(server, 'post', '/token', AdminClientData, 200)
        .then(function (response) {
          adminClientToken = response.body.data.accessToken
          domain = connection.extractDomain(adminClientToken)

          return commonUtils.makeRequest(server, 'put', '/snippet', validSnippet, 200,
            ['Authorization'], [adminClientToken])
        })
        .then(function () {
          // Hijack the register in order not to depend on rabbit for travis
          return server.composr.Snippet.register(domain, validSnippet)
        })
        .should.notify(done)
    })

    it('should return an error if the request is made with an incorrect authorization', function (done) {
      request(server.app)
        .del('/snippet/' + domain + '!valid-2.3.3')
        .set('Authorization', 'fakeClientToken')
        .expect(401)
        .end(function (err, response) {
          expect(response.body.error).to.equals('error:delete:snippet')
          done(err)
        })
    })

    it('should return an error if the request is made without authorization', function (done) {
      request(server.app)
        .del('/snippet/' + domain + '!valid-2.3.3')
        .expect(401)
        .end(function (err, response) {
          expect(response.body.error).to.equals('missing:header:authorization')
          done(err)
        })
    })

    it('allows to delete a snippet', function (done) {
      this.timeout(30000)
      request(server.app)
        .del('/snippet/' + domain + '!valid-2.3.3')
        .set('Authorization', adminClientToken)
        .expect(204)
        .end(function (err, response) {
          expect(response.statusCode).to.equals(204)
          done(err)
        })
    })
  })
}

module.exports = test
