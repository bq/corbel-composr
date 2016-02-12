'use strict';
var request = require('supertest'),
  chai = require('chai'),
  expect = chai.expect,
  chaiAsPromised = require('chai-as-promised'),
  clientUtils = require('../../utils/client'),
  commonUtils = require('../../utils/commonUtils');

chai.use(chaiAsPromised);

function test(server) {
  describe('getAll phrases', function() {
    var AdminClientData = clientUtils.getAdminClient();
    var adminClientToken;
    this.timeout(10000);

    before(function(done) {
      this.timeout(30000);
      commonUtils.makeRequest(server, 'post', '/token', AdminClientData, 200)
      .then(function(response){
        adminClientToken = response.body.data.accessToken;
      })
      .should.notify(done);
    });

    it('should return a list of phrases with a get to /phrase with correct authorization', function(done) {
      request(server.app)
      .get('/phrase')
      .set('Authorization', adminClientToken)
      .expect(200)
      .end(function(err, response) {
        expect(response.body).to.be.an('array');
        done(err);
      });
    });

    it('should return unauthorized if the request is made with an incorrect authorization', function(done) {
      request(server.app)
      .get('/phrase')
      .set('Authorization', 'fakeClientToken')
      .expect(401)
      .end(function(err, response){
        expect(response.body.error).to.equals('error:domain:undefined');
        done(err);
      });
    });

    it('should return unauthorized if the request is made without authorization', function(done) {
      request(server.app)
      .get('/phrase')
      .expect(401)
      .end(function(err, response){
        expect(response.body.error).to.equals('missing:header:authorization');
        done(err);
      });
    });
  });
}

module.exports = test;
