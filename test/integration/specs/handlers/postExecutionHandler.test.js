'use strict'

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect

function test (server) {
  describe('Post execution handlers', function () {
    it('sets the body when calling an endpoint with a postexecution', function (done) {
      request(server.app)
        .post('/postexecutionhandler')
        .expect(200)
        .end(function (error, response) {
          expect(response.body.hello).to.equals('world')
          done(error)
        })
    })
  })
}

module.exports = test
