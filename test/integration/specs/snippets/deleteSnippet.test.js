'use strict';
var request = require('supertest'),
  chai = require('chai'),
  expect = chai.expect,
  clientUtils = require('../../utils/client'),
  commonUtils = require('../../utils/commonUtils');


function test(server) {
  describe('Delete snippet', function() {
    var codehash = 'var userModel = function(id){ this.id = id; }; exports(userModel);';
    var snippetId = 'testDomainComposr!valid';
    var AdminClientData = clientUtils.getAdminClient();
    var demoAppClientData = clientUtils.getDemoClient();
    var adminClientToken;
    var validSnippet = {
      id: snippetId,
      codehash: server.composr.utils.encodeToBase64(codehash)
    };

    before(function(done) {
      this.timeout(30000);
      commonUtils.makeRequest(server, 'post', '/token', AdminClientData, 200)
      .then(function(response){
        adminClientToken = response.body.data.accessToken;

        return commonUtils.makeRequest(server, 'put', '/snippet', validSnippet, 204, 
                ['Authorization'], [adminClientToken]);
      })
      .should.notify(done);
    });

    it('Allows to delete a snippet', function(done) {
      this.timeout(30000);
      request(server.app)
        .del('/snippet/' + snippetId)
        .set('Authorization', adminClientToken)
        .expect(204)
        .end(function(err, response) {
          expect(response.statusCode).to.equals(204);
          done(err);
        });
    });

  });
}

module.exports = test;
