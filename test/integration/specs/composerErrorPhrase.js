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

        var composerErrorPhrase = require('../../fixtures/phrases/composerErrorPhrase.json');

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

        describe('Composr error phrase', function() {
            var composerErrorPhraseLocation;

            it('is created correctly', function(done) {
                this.timeout(30000);
                request(app)
                    .put('/phrase')
                    .set('Authorization', adminClientToken)
                    .send(composerErrorPhrase)
                    .expect(204)
                    .end(function(err, response) {
                        expect(response.headers).to.exist;
                        composerErrorPhraseLocation = response.headers.location;
                        expect(composerErrorPhraseLocation).to.exist;
                        done(err);
                    });
            });

            it('throws an error when using it', function(done) {
                var phraseEndpoint = composerErrorPhrase.url;
                var domain = composerErrorPhraseLocation.replace('phrase/', '').split('!')[0];
                var url = '/' + domain + '/' + phraseEndpoint;
                this.timeout(30000);

                //let's wait till corbel triggers the event to register the phrase in composr
                //TODO: use any tool to know when it happens
                setTimeout(function() {

                    request(app)
                        .post(url)
                        .send(demoAppClientData)
                        .expect(407)
                        .end(function(err, response) {
                            expect(response).to.be.an('object');
                            expect(response.body.httpStatus).to.be.equal(407);
                            expect(response.body.error).to.be.a('string');
                            expect(response.body.errorDescription).to.be.a('string');
                            expect(response.body.errorDescription).to.equals('This is an error');
                            done(err);
                        });

                }, 3000);

            });

        });



    });


}

module.exports = test;
