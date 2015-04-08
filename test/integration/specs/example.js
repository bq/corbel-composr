'use strict';

var request = require('request'),
    chai = require('chai'),
    expect = chai.expect;

describe('Example test', function() {

    it('calling a working composer', function(done) {

        request('http://localhost:3000', function(error, response, body) {
            expect(response).to.be.an('object');
            if (!error && response.statusCode === 200) {
                return done();
            } else {
                return done(error || response);
            }
        });

    });

});
