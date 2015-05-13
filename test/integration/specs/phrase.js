'use strict';
var request = require('supertest'),
    chai = require('chai'),
    expect = chai.expect;

var clientData = require('../../fixtures/client/clientAdmin.json');

//Use environment variables (if jenkins provided those), fixtures ones other way.
var adminClientData = {
  clientId : process.env.COMPOSR_TEST_ADMINUSER_CLIENTID ? process.env.COMPOSR_TEST_ADMINUSER_CLIENTID : clientData.clientId,
  clientSecret : process.env.COMPOSR_TEST_ADMINUSER_CLIENTSECRET ? process.env.COMPOSR_TEST_ADMINUSER_CLIENTSECRET : clientData.clientSecret,
  scopes : process.env.COMPOSR_TEST_ADMINUSER_SCOPES ? process.env.COMPOSR_TEST_ADMINUSER_SCOPES : clientData.scopes
};

var clientToken, phraseLocationForDeletion;

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
        var phrase = require('../../fixtures/phrases/helloWorld.json');

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
