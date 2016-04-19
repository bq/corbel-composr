'use strict'

var request = require('supertest')

function test (server) {
  describe('Get to unexisting endpoint returns not found', function () {
    it('should return not found (404) when get to /domain/user', function (done) {
      request(server.app)
        .get('/domain/user')
        .expect(404, done)
    })
  })
}

module.exports = test
