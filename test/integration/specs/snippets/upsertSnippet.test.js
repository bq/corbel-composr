'use strict'
/* globals before after describe it */

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var clientUtils = require('../../utils/client')
var commonUtils = require('../../utils/commonUtils')
var connection = require('../../../../src/lib/corbelConnection')

function test (server) {
  describe('Upsert snippet', function () {
    this.timeout(30000)

    var code = 'var userModel = function(id){ this.id = id; }; exports(userModel);'
    var AdminClientData = clientUtils.getAdminClient()
    var adminClientToken
    var domain

    var validSnippet = {
      name: 'valid',
      version: '1.1.1',
      codehash: server.composr.utils.encodeToBase64(code)
    }

    var invalidSnippet = {
      'name': 'invalid',
      version: '1.1.1',
      codehash: server.composr.utils.encodeToBase64('var a = 3;')
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
      var promises = [domain + '!valid-1.1.1']
        .map(function (snippetId) {
          return commonUtils.makeRequest(server, 'del', '/snippet/' + snippetId, null, 204,
            ['Authorization'], [adminClientToken])
        })

      Promise.all(promises)
        .should.notify(done)
    })

    it('allows to create a wellformed snippet', function (done) {
      request(server.app)
        .put('/snippet')
        .set('Authorization', adminClientToken)
        .send(validSnippet)
        .expect(200)
        .end(function (err, response) {
          expect(response.statusCode).to.equals(200)

          // Hijack the register in order not to depend on rabbit for travis
          server.composr.Snippet.register(domain, validSnippet)
            .then(function () {
              done(err)
            })
        })
    })

    it('fails creating a badformed snippet', function (done) {
      request(server.app)
        .put('/snippet')
        .set('Authorization', adminClientToken)
        .send(invalidSnippet)
        .expect(422)
        .end(function (err, response) {
          expect(response.status).to.equals(422)
          expect(response.body.error).to.equals('error:snippet:validation')
          done(err)
        })
    })

    it('should return an error if the request is made with an incorrect authorization', function (done) {
      request(server.app)
        .put('/snippet')
        .set('Authorization', 'fakeClientToken')
        .send(validSnippet)
        .expect(401)
        .end(function (err, response) {
          expect(response.body.error).to.equals('error:upsert:snippet')
          done(err)
        })
    })

    it('should return an error if the request is made without authorization', function (done) {
      request(server.app)
        .put('/snippet')
        .send(validSnippet)
        .expect(401)
        .end(function (err, response) {
          expect(response.body.error).to.equals('missing:header:authorization')
          done(err)
        })
    })
  })
}

module.exports = test
