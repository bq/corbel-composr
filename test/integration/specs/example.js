'use strict';

var request = require('request'),
    chai = require('chai'),
    expect = chai.expect;

describe('Working:', function() {

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

    it('responds when the phrase executes correctly', function(done) {

        request('http://localhost:3000/t3phrase', function(error, response, body) {
            expect(response).to.be.an('object');
            expect(JSON.parse(body).yes).to.equals('potatoe');
            if (!error && response.statusCode === 200) {
                return done();
            } else {
                return done(error || response);
            }
        });

    });

});
