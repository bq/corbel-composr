'use strict';
var request = require('request'),
    chai = require('chai'),
    q = require('q'),
    expect = chai.expect;

describe('When a request to composr has errors', function() {

    it('it fails with a 500 error', function(done) {

        request('http://localhost:3000/e1', function(error, response) {

            expect(response).to.be.an('object');
            if (response.statusCode === 500) {
                return done();
            } else {
                return done(error || response);
            }

        });
    });

    it('it fails with a 555 error', function(done) {

        request('http://localhost:3000/e2', function(error, response) {

            expect(response).to.be.an('object');
            if (response.statusCode === 555) {
                return done();
            } else {
                return done(error || response);
            }

        });
    });
});
