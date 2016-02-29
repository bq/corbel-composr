'use strict';
var request = require('supertest'),
  chai = require('chai'),
  expect = chai.expect,
  clientUtils = require('../../utils/client'),
  validVirtualDomain = require('../../../fixtures/api/validVirtualDomain.json');

var AdminClientData = clientUtils.getAdminClient();
var adminClientToken;

function test(server) {
  describe.only('Publish VirtualDomain', function() {

    before(function(done) {
      this.timeout(30000);
      request(server.app)
        .post('/token')
        .send(AdminClientData)
        .expect(200)
        .end(function(err, response) {
          expect(response).to.be.an('object');
          console.log(response.body);
          expect(response.body.data.accessToken).to.exist;
          adminClientToken = response.body.data.accessToken;

          done(err);
        });
    });

    it('Allows to create a valid VirtualDomain', function(done) {
      this.timeout(30000);
      request(server.app)
        .put('/vdomain')
        .set('Authorization', adminClientToken)
        .send(validVirtualDomain)
        .expect(200)
        .end(function(err, response) {
          console.log(response);
          done(err);
        });
    });

  });

}

module.exports = test;
