'use strict'

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect

function test (server) {
  describe('Method not allowed error', function () {
    it('returns a custom error', function (done) {
      request(server.app)
        .del('/e2')
        .expect(405)
        .end(function (error, response) {
          expect(response).to.be.an('object')
          expect(response.body).to.include.keys('error', 'errorDescription')
          expect(response.body.error).to.equals('unknown:method')
          expect(response.body.errorDescription).to.equals('DELETE method not allowed')
          done(error)
        })
    })
  })
}

module.exports = test
