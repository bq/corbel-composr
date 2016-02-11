'use strict';
var request = require('supertest'),
  chai = require('chai'),
  expect = chai.expect,
  clientUtils = require('../../utils/client');

var AdminClientData = clientUtils.getAdminClient();
var demoAppClientData = clientUtils.getDemoClient();

var adminClientToken;

function test(server) {
  describe('Publish phrases', function() {

    var phrase = {
      'url': 'published/phrase',
      'get': {
        'code': 'res.status(200).send({ "hello": "World!"});',
        'doc': {

        }
      }
    };

    var invalidPhrase = {
      'url': 'notpublished/phrase',
      'get': {
        'code': 'return res.status(200).send({ "hello": "World!"});'
      }
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

    it('Allows to create a wellformed phrase', function(done) {
      this.timeout(30000);
      request(server.app)
        .put('/phrase')
        .set('Authorization', adminClientToken)
        .send(phrase)
        .expect(204)
        .end(function(err, response) {
          expect(response.headers).to.exist;
          var brokenPhraseLocation = response.headers.location;
          expect(brokenPhraseLocation).to.exist;
          done(err);
        });
    });

    it('Allows to delete a created phrase', function(done) {
      this.timeout(30000);
      request(server.app)
        .del('/phrase/' + phrase.url.replace('/', '!'))
        .set('Authorization', adminClientToken)
        .expect(204)
        .end(function(err, response) {
          done(err);
        });
    });

    it('fails creating a badformed phrase', function(done) {
      this.timeout(30000);
      request(server.app)
        .put('/phrase')
        .set('Authorization', adminClientToken)
        .send(invalidPhrase)
        .expect(422)
        .end(function(err, response) {
          expect(response.status).to.equals(422);
          expect(response.body.error).to.equals('error:phrase:validation');
          done(err);
        });
    });

  });


}

module.exports = test;
