'use strict';
var request = require('supertest'),
    chai = require('chai'),
    expect = chai.expect;

var clientData = require('../../fixtures/client/clientQA.json');
var clientToken, phraseLocationForDeletion;

function test(app){
  describe('Login a client for creating phrases', function(){
    it('obtains a new token', function(done){

      request(app)
        .post('/token')
        .send(clientData)
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
        var phrase = require('../../fixtures/phrases/phraseLogin.json');

        request(app)
          .put('/phrase')
          .set('Authorization', clientToken)
          .send(phrase)
          .expect(204)
          .end(function(err, response){
            expect(response.headers).to.exist;
            phraseLocationForDeletion = response.headers['location'];
            expect(phraseLocationForDeletion.length).to.be.above(0);
            done(err);
          });
    });
  });

  describe('Phrase : deletion', function(){

    it('it deletes a phrase', function(done) {

        request(app)
          .del('/' + phraseLocationForDeletion)
          .set('Authorization', clientToken)
          .expect(204)
          .end(function(err, response){
            done(err);
          });
    });
  });

}

module.exports = test;
