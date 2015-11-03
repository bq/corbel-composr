'use strict';
var request = require('supertest'),
  chai = require('chai'),
  expect = chai.expect,
  chaiAsPromised = require('chai-as-promised'),
  should = chai.should();

chai.use(chaiAsPromised);

function test(server) {
  describe('Query params', function() {
    var phrase = {
      url: 'queryparams',
      get: {
        code: 'res.status(200).send(req.query);',
        doc: {

        }
      }
    };

    before(function(done) {
      server.composr.Phrases.register('testDomainComposr', phrase)
        .should.be.fulfilled.notify(done);
    });

    it('executes the phrase correctly with query params', function(done) {
      this.timeout(30000);
      request(server.app)
        .get('/testDomainComposr/queryparams?id=10&name=Atreides')
        .expect(200)
        .end(function(err, response) {
          expect(response).to.be.an('object');
          expect(response.body.id).to.equals('10');
          expect(response.body.name).to.equals('Atreides');
          done(err);
        });
    });

    it('executes the phrase correctly a second time with query params', function(done) {
      this.timeout(30000);
      request(server.app)
        .get('/testDomainComposr/queryparams?id=20&name=Harkonnen')
        .expect(200)
        .end(function(err, response) {
          expect(response).to.be.an('object');
          expect(response.body.id).to.equals('20');
          expect(response.body.name).to.equals('Harkonnen');
          done(err);
        });
    });

  });
}

module.exports = test;
