'use strict';
var request = require('supertest'),
  chai = require('chai'),
  expect = chai.expect,
  clientUtils = require('../../utils/client'),
  commonUtils = require('../../utils/commonUtils');


function test(server) {
  describe('Upsert snippet', function() {
    var codehash = 'var userModel = function(id){ this.id = id; }; exports(userModel);';
    var AdminClientData = clientUtils.getAdminClient();
    var demoAppClientData = clientUtils.getDemoClient();
    var adminClientToken;
    var snippetIds = [];
    var validSnippet = {
      id: 'testDomainComposr!valid',
      codehash: server.composr.utils.encodeToBase64(codehash)
    };

    var invalidSnippet = {
      'id': 'testDomainComposr!invalid',
      codehash: server.composr.utils.encodeToBase64('var a = 3;')
    };

    before(function(done) {
      this.timeout(30000);
      commonUtils.makeRequest(server, 'post', '/token', AdminClientData, 200)
      .then(function(response){
        adminClientToken = response.body.data.accessToken;
      })
      .should.notify(done);
    });

    after(function(done) {
      this.timeout(30000);
      var promises = snippetIds.map(function(snippet){
        return commonUtils.makeRequest(server, 'del', snippet, null, 204,
                ['Authorization'], [adminClientToken])
      });

      Promise.all(promises)
      .should.notify(done);
    });

    it('allows to create a wellformed snippet', function(done) {
      this.timeout(30000);
      request(server.app)
        .put('/snippet')
        .set('Authorization', adminClientToken)
        .send(validSnippet)
        .expect(204)
        .end(function(err, response) {
          expect(response.statusCode).to.equals(204);
          snippetIds.push('/snippet/' + validSnippet.id);
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
          expect(response.status).to.equals(422);
          expect(response.body.error).to.equals('error:snippet:validation');
          done(err);
        });
    });

    it('should return an error if the request is made with an incorrect authorization', function(done) {
      request(server.app)
      .put('/snippet')
      .set('Authorization', 'fakeClientToken')
      .send(validSnippet)
      .expect(401)
      .end(function(err, response){
        expect(response.body.error).to.equals('error:upsert:snippet');
        done(err);
      });
    });

    it('should return an error if the request is made without authorization', function(done) {
      request(server.app)
      .put('/snippet')
      .send(validSnippet)
      .expect(401)
      .end(function(err, response){
        expect(response.body.error).to.equals('missing:header:authorization');
        done(err);
      });
    });

  });
}

module.exports = test;
