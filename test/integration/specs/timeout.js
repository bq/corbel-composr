'use strict';
var request = require('request'),
    chai = require('chai'),
    expect = chai.expect;

describe('When a request to composr takes more than 10 seconds', function() {

    it('it fails with a 504 error', function(done) {

        this.timeout(30000);

        request('http://localhost:3000/t1', function(error, response, body) {
            expect(response).to.be.an('object');
            if (response.statusCode === 504) {
                return done();
            } else {
                return done(error || response);
            }

        });
    });

    it('it fails with a 504 error on t2', function(done) {

        this.timeout(30000);

        request('http://localhost:3000/t2', function(error, response, body) {
            expect(response).to.be.an('object');
            if (response.statusCode === 504) {
                return done();
            } else {
                return done(error || response);
            }

        });
    });
});
