'use strict';
var request = require('supertest'),
  chai = require('chai'),
  expect = chai.expect;

function test(server) {

  describe('Not found paths', function() {

    it('it returns a custom error', function(done) {

      request(server.app)
        .get('/asdasdasdad')
        .expect(404)
        .end(function(error, response) {
          expect(response).to.be.an('object');
          expect(response.body).to.include.keys('error', 'errorDescription');
          expect(response.body.error).to.equals('error:not_found');
          done(error);
        });
    });

  });
}

module.exports = test;
