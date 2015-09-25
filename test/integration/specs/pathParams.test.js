'use strict';
var request = require('supertest'),
  chai = require('chai'),
  expect = chai.expect,
  chaiAsPromised = require('chai-as-promised'),
  should = chai.should();

chai.use(chaiAsPromised);

function test(server) {
  describe('Path params', function() {
    var phrase = {
      url: 'pathparams/:id/:name',
      get: {
        code: 'res.status(200).send(req.params);',
        doc: {

        }
      }
    };

    before(function(done) {
      server.composr.Phrases.register('testDomainComposr', phrase)
        .should.be.fulfilled.notify(done);
    });

    it('executes the phrase correctly', function(done) {
      this.timeout(30000);

      request(server.app)
        .get('/testDomainComposr/pathparams/1/pepe')
        .expect(200)
        .end(function(err, response) {
          expect(response).to.be.an('object');
          console.log(response.body);
          expect(response.body.name).to.equals('pepe');
          expect(response.body.id).to.equals('1');
          done(err);
        });
    });

    it('executes the phrase correctly a second time', function(done) {
      this.timeout(30000);

      request(server.app)
        .get('/testDomainComposr/pathparams/2/pacopepe')
        .expect(200)
        .end(function(err, response) {
          expect(response).to.be.an('object');
          console.log(response.body);
          expect(response.body.name).to.equals('pacopepe');
          expect(response.body.id).to.equals('2');
          done(err);
        });
    });

  });
}

module.exports = test;