'use strict';

var request = require('supertest'),
    chai = require('chai'),
    expect = chai.expect;

function test(app){
  describe('Working:', function() {

      it('calling a working composer', function(done) {

          request(app)
            .get('/')
            .expect(200)
            .end(function(error, response) {
              expect(response).to.be.an('object');
              if (!error && response.statusCode === 200) {
                  return done();
              } else {
                  return done(error || response);
              }
          });

      });

      it('responds when the phrase executes correctly', function(done) {

          request(app)
            .get('/t3phrase')
            .expect(200)
            .end(function(error, response) {
              expect(response).to.be.an('object');
              expect(response.body.yes).to.equals('potatoe');
              if (!error && response.statusCode === 200) {
                  return done();
              } else {
                  return done(error || response);
              }
          });

      });

  });

}

module.exports = test;
