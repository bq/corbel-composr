'use strict';
var request = require('supertest'),
  chai = require('chai'),
  corbeljs = require('corbel-js'),
  expect = chai.expect;

var adminClientData = require('../utils/client').getAdminClient();
var phrase = require('../../fixtures/phrases/helloWorld.json');
var clientToken;

function test(app) {
  describe('Login a client for creating phrases', function() {
    it('obtains a new token', function(done) {

      request(app)
        .post('/token')
        .send(adminClientData)
        .expect(200)
        .end(function(err, response) {
          expect(response).to.be.an('object');
          expect(response.body.data.accessToken).to.exist;
          clientToken = response.body.data.accessToken;
          done(err);
        });
    });
  });

  describe('Phrase: Creation', function() {

    it('it registers a new phrase', function(done) {
      this.timeout(30000);

      request(app)
        .put('/phrase')
        .set('Authorization', clientToken)
        .send(phrase)
        .expect(204)
        .end(function(err, response) {
          expect(response.headers).to.exist;
          expect(response.headers['location']).to.be.a('string');
          done(err);
        });
    });
  });

  describe('Phrase : update', function() {

    it('it updates a phrase', function(done) {
      this.timeout(30000);

      phrase.get.code = 'res.json({value: "updated"});';

      request(app)
        .put('/phrase')
        .set('Authorization', clientToken)
        .send(phrase)
        .expect(204)
        .end(function(err, response) {

          expect(response.headers).to.exist;
          expect(response.headers['location']).to.be.a('string');

          var decoded = corbeljs.jwt.decode(clientToken);

          setTimeout(function() {
            request(app)
              .get('/' + decoded.domainId + '/' + phrase.url)
              .expect(200)
              .end(function(err, response) {
                expect(response.body).to.exist;
                expect(response.body.value).to.be.equal('updated');
                done(err);
              });
          }, 3000);

        });

    });
  });

  describe('Phrase : deletion', function() {

    it('it deletes a phrase', function(done) {

      request(app)
        .del('/phrase/' + phrase.url)
        .set('Authorization', clientToken)
        .expect(204)
        .end(function(err, response) {
          done(err);
        });
    });
  });

}

module.exports = test;
