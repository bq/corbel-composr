'use strict';
var request = require('supertest'),
  chai = require('chai'),
  corbeljs = require('corbel-js'),
  phraseManager = require('../../../src/lib/phraseManager.js'),
  sinon = require('sinon'),
  expect = chai.expect;

var adminClientData = require('../utils/client').getAdminClient();
var phrase = require('../../fixtures/phrases/helloWorld.json');
var phraseBase64 = require('../../fixtures/phrases/codehash.json');
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

    it('it registers a new phrase with base64 code', function(done) {
      this.timeout(30000);

      request(app)
        .put('/phrase')
        .set('Authorization', clientToken)
        .send(phraseBase64)
        .expect(204)
        .end(function(err, response) {
          expect(response.headers).to.exist;
          expect(response.headers['location']).to.be.a('string');
          done(err);
        });
    });
  });



  describe('Phrase : update', function() {
    var spy;
    before(function() {
      spy = sinon.spy(phraseManager, 'registerPhrase');
    });

    after(function() {
      spy.reset();
    });

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

          if (process.env.NODE_ENV === 'development') {
            var decoded = corbeljs.jwt.decode(clientToken);

            setTimeout(function() {
              expect(spy.called).to.equals(true);

              request(app)
                .get('/' + decoded.domainId + '/' + phrase.url)
                .expect(200)
                .end(function(err, response) {
                  expect(response.body).to.exist;
                  expect(response.body.value).to.be.equal('updated');
                  done(err);
                });
            }, 5000);
          } else {
            done(err);
          }

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


  describe('Phrase: Badformed url', function() {
    var phraseWithBadFormedUrl = {
      url: 'test!/!:notgood/!12321!asdasd/!asda',
      "get": {
        "code": "console.log('ey');",
        "doc": {
          "description": "Phrase for login a client",
        }
      }
    };

    it('returns a 422 if the phrase has an invalid url', function(done) {
      this.timeout(30000);

      request(app)
        .put('/phrase')
        .set('Authorization', clientToken)
        .send(phraseWithBadFormedUrl)
        .expect(422)
        .end(function(err, response) {
          //console.log(response.body);
          done(err);
        });
    });
  });


}

module.exports = test;