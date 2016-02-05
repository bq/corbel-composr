'use strict';
var request = require('supertest'),
  chai = require('chai'),
  expect = chai.expect,
  clientUtils = require('../../utils/client');

var AdminClientData = clientUtils.getAdminClient();
var demoAppClientData = clientUtils.getDemoClient();

var adminClientToken;

function test(server) {
  describe('Publish snippet', function() {

    var validSnippet = {
      id: 'testDomainComposr!TheSnippet1',
      codehash: server.composr.utils.encodeToBase64('var userModel = function(id){ this.id = id; }; exports(userModel);')
    };

    var invalidSnippet = {
      'id': 'testDomainComposr!something',
      codehash: server.composr.utils.encodeToBase64('var a = 3;')
    };

    before(function(done) {
      this.timeout(30000);
      request(server.app)
        .post('/token')
        .send(AdminClientData)
        .expect(200)
        .end(function(err, response) {
          expect(response).to.be.an('object');
          expect(response.body.data.accessToken).to.exist;
          adminClientToken = response.body.data.accessToken;

          done(err);
        });
    });

    it('Allows to create a wellformed snippet', function(done) {
      this.timeout(30000);
      request(server.app)
        .put('/snippet')
        .set('Authorization', adminClientToken)
        .send(validSnippet)
        .expect(204)
        .end(function(err, response) {
          expect(response.statusCode).to.equals(204);
          done(err);
        });
    });

    it('fails creating a badformed snippet', function(done) {
      this.timeout(30000);
      request(server.app)
        .put('/snippet')
        .set('Authorization', adminClientToken)
        .send(invalidSnippet)
        .expect(422)
        .end(function(err, response) {
          expect(response.statusCode).to.equals(422);
          expect(response.status).to.equals(422);
          done(err);
        });
    });

  });


}

module.exports = test;
