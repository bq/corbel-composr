'use strict';
var request = require('supertest'),
chai = require('chai'),
chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

function test(server) {
  describe('Get to domain/user returns not found', function() {
    it('should return not found (404) when get to /domain/user', function(done) {
      request(server.app)
      .get('/domain/user')
      .expect(404,done);
    });
  });
}

module.exports = test;
