'use strict';
var request = require('supertest'),
    chai = require('chai'),
    expect = chai.expect;

function test(app){
  describe('When a request to composr takes more than 10 seconds', function() {

      it('it fails with a 503 error', function(done) {

          this.timeout(30000);

          request(app)
            .get('/t1')
            .expect(503)
            .end(function(error, response) {

              expect(response).to.be.an('object');
              if (response.statusCode === 503) {
                  return done();
              } else {
                  return done(error || response);
              }

          });
      });

      it('it fails with a 503 error on t2', function(done) {

          this.timeout(30000);

          request(app)
            .get('/t2')
            .expect(503)
            .end(function(error, response) {
              expect(response).to.be.an('object');
              if (response.statusCode === 503) {
                  return done();
              } else {
                  return done(error || response);
              }

          });
      });

      it.skip('it fails with a 503 error on t2phrase', function(done) {

          this.timeout(30000);

          request(app)
            .get('/t2phrase')
            .expect(503)
            .end(function(error, response) {
              expect(response).to.be.an('object');
              if (response.statusCode === 503) {
                  return done();
              } else {
                  return done(error || response);
              }

          });
      });
  });
}

module.exports = test;
