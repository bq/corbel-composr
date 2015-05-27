'use strict';
var request = require('supertest'),
    chai = require('chai'),
    expect = chai.expect,
    clientUtils = require('../utils/client');

var AdminClientData = clientUtils.getAdminClient();
var demoAppClientData = clientUtils.getDemoClient();

var adminClientToken;

function test(app) {
    describe('A phrase with a broken code,', function() {

        var brokenPhrase = require('../../fixtures/phrases/brokenPhrase.json');

        before(function(done) {
            this.timeout(30000);
            request(app)
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

        describe('Broken login phrase', function() {
            var brokenPhraseLocation;

            it('is created correctly', function(done) {
                this.timeout(30000);
                request(app)
                    .put('/phrase')
                    .set('Authorization', adminClientToken)
                    .send(brokenPhrase)
                    .expect(204)
                    .end(function(err, response) {
                        expect(response.headers).to.exist;
                        brokenPhraseLocation = response.headers.location;
                        expect(brokenPhraseLocation.length).to.be.above(0);
                        done(err);
                    });
            });

            it('throws an error when using it', function(done) {
                var phraseEndpoint = brokenPhrase.url;
                var domain = brokenPhraseLocation.replace('phrase/', '').split('!')[0];
                var url = '/' + domain + '/' + phraseEndpoint;
                this.timeout(30000);

                //let's wait till corbel triggers the event to register the phrase in composr
                //TODO: use any tool to know when it happens
                setTimeout(function() {

                    request(app)
                        .post(url)
                        .send(demoAppClientData)
                        .expect(500)
                        .end(function(err, response) {
                            expect(response).to.be.an('object');
                            console.log('PUTAAA', err);
                            done(err);
                        });

                }, 2000);

            });

        });



    });


}

module.exports = test;
