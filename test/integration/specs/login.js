'use strict';
var request = require('supertest'),
    chai = require('chai'),
    expect = chai.expect,
    clientUtils = require('../utils/client');

var clientData = clientUtils.getAdminClient();
var demoAppClientData = clientUtils.getDemoClient();

var clientToken, phraseClientLoginLocation, demoAppClientToken, clientLoginPhraseUrl;

function test(app){
  describe('Create a login phrase and use it for logging the user', function(){

    var loginphrase = require('../../fixtures/phrases/phraseLoginClient.json');

    before(function(done){
      request(app)
        .post('/token')
        .send(demoAppClientData)
        .expect(200)
        .end(function(err, response){
          expect(response).to.be.an('object');
          expect(response.body.data.accessToken).to.exist;
          clientToken = response.body.data.accessToken;
          done(err);
        });
    });

    it('creates the client login phrase', function(done){

      request(app)
        .put('/phrase')
        .set('Authorization', clientToken)
        .send(loginphrase)
        .expect(204)
        .end(function(err, response){
          expect(response.headers).to.exist;
          phraseClientLoginLocation = response.headers['location'];
          expect(phraseClientLoginLocation.length).to.be.above(0);
          done(err);
        });
    });

    it('receives a token after calling the client login phrase', function(done){
      var phraseEndpoint = loginphrase.url;
      var domain = phraseClientLoginLocation.replace('phrase/', '').split('!')[0];
      clientLoginPhraseUrl = '/' + domain + '/' + phraseEndpoint;
      this.timeout(30000);
      console.log(demoAppClientData);

      //let's wait till corbel triggers the event to register the phrase in composr
      //TODO: use any tool to know when it happens
      setTimeout(function(){

        request(app)
          .post(clientLoginPhraseUrl)
          .send(demoAppClientData)
          .expect(200)
          .end(function(err, response){
            expect(response).to.be.an('object');
            expect(response.body.data.accessToken).to.exist;
            demoAppClientToken = response.body.data.accessToken;
            done(err);
          });

      }, 5000);

    });

    describe('User login', function(){

      var phraseUserLoginLocation;
      var userLoginPhrase = require('../../fixtures/phrases/phraseLoginUser.json');

      it('creates the user login phrase', function(done){

        request(app)
          .put('/phrase')
          .set('Authorization', demoAppClientToken)
          .send(userLoginPhrase)
          .expect(204)
          .end(function(err, response){
            expect(response.headers).to.exist;
            phraseUserLoginLocation = response.headers['location'];
            expect(phraseUserLoginLocation.length).to.be.above(0);
            done(err);
          });
      });

      it('calls the user login phrase and returns a user object, and access, expire and refresh tokens', function(done){
        var phraseEndpoint = userLoginPhrase.url;
        var domain = phraseUserLoginLocation.replace('phrase/', '').split('!')[0];
        clientLoginPhraseUrl = '/' + domain + '/' + phraseEndpoint;

        //Returns the data needed to make a user login
        var demoUserData = clientUtils.getUser();

        this.timeout(30000);

        //let's wait till corbel triggers the event to register the phrase in composr
        //TODO: use any tool to know when it happens
        setTimeout(function(){

          request(app)
            .post(clientLoginPhraseUrl)
            .set('Authorization', demoAppClientToken)
            .send(demoUserData)
            .expect(200)
            .end(function(err, response){
              expect(response).to.be.an('object');
              console.log(response.body);
              console.log('eeeeeeeeeeeeeeeeeeeee');
              expect(response.body.data.accessToken).to.exist;
              demoAppClientToken = response.body.data.accessToken;
              done(err);
            });

        }, 5000);

      });

      //TODO: return the user data
    });


  });


}

module.exports = test;
