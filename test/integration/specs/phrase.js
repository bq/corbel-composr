'use strict';
var request = require('supertest'),
    chai = require('chai'),
    expect = chai.expect;

var adminClientData = require('../utils/client').getAdminClient();
var phrase = require('../../fixtures/phrases/helloWorld.json');
var clientToken;

function test(app){
  describe('Login a client for creating phrases', function(){
    it('obtains a new token', function(done){

      request(app)
        .post('/token')
        .send(adminClientData)
        .expect(200)
        .end(function(err, response){
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
          .end(function(err, response){
            expect(response.headers).to.exist;
            expect(response.headers['location'].length).to.be.above(0);
            done(err);
          });
    });
  });

  describe('Phrase : deletion', function(){

    it('it deletes a phrase', function(done) {

        request(app)
          .del('/phrase/' + phrase.url)
          .set('Authorization', clientToken)
          .expect(204)
          .end(function(err, response){
            done(err);
          });
    });
  });

}

module.exports = test;
