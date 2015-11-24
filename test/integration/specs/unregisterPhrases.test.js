'use strict';
var request = require('supertest'),
  chai = require('chai'),
  expect = chai.expect,
  chaiAsPromised = require('chai-as-promised'),
  should = chai.should();
chai.use(chaiAsPromised);

function test(server) {
  describe('Unregister single phrase', function() {
    var phraseWithTwoParams = {
      url: 'unregister/:name/:surname',
      get: {
        code: 'res.status(200).send(req.params);',
        doc: {}
      }
    };

    beforeEach(function(done) {
      server.composr.Phrases.register('testDomainComposr', [phraseWithTwoParams])
        .should.be.eventually.fulfilled.and.notify(done);
    });

    it('can unregister a phrase', function(done) {
      this.timeout(30000);
      // phrase is working
      request(server.app)
        .get('/testDomainComposr/unregister/juan/palomo')
        .expect(200)
        .end(function(err, response) {
          expect(response).to.be.an('object');
          expect(response.body.name).to.equals('juan');
          expect(response.body.surname).to.equals('palomo');
          //phrase is unregistered
          var phraseId = server.composr.Phrases._generateId('unregister/:name/:surname', 'testDomainComposr');
          server.composr.Phrases.unregister('testDomainComposr',
            phraseId);
          //phrase is not registered
          request(server.app)
            .get('/testDomainComposr/unregister/juan/palomo')
            .expect(404)
            .end(function(err, response) {
              expect(response).to.be.an('object');
              expect(response.status).to.equals(404);
              expect(response.error.text).to.equals('{"message":"endpoint:not:found"}');
              expect(response.body.surname).to.equals(undefined);
              done(err);
            });

        });
    });
  });

  describe('Unregister multiple phrases', function() {
    var phraseWithTwoParams = {
      url: 'unregister/:name/:surname',
      get: {
        code: 'res.status(200).send(req.params);',
        doc: {}
      }
    };

    var phraseWithOneParam = {
      url: 'unregister/:name',
      get: {
        code: 'res.status(200).send(req.params);',
        doc: {}
      }
    };

    beforeEach(function(done) {
      server.composr.Phrases.register('testDomainComposr', [phraseWithTwoParams, phraseWithOneParam])
        .should.be.eventually.fulfilled.and.notify(done);
    });

    it('can unregister multiple phrases simultaneously', function(done) {
      this.timeout(30000);

      var phraseWithOneParamId = server.composr.Phrases._generateId('unregister/:name', 'testDomainComposr');
      var phraseWithTwoParamsId = server.composr.Phrases._generateId('unregister/:name/:surname', 'testDomainComposr');

      server.composr.Phrases.unregister('testDomainComposr', [phraseWithOneParamId, phraseWithTwoParamsId]);


      var promiseUnregisterFirstPhrase = new Promise(function(resolve, reject) {
        request(server.app)
          .get('/testDomainComposr/unregister/juan/palomo')
          .expect(404)
          .end(function(err, response) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
      });
      var promiseUnregisterSecondPhrase = new Promise(function(resolve, reject) {
        request(server.app)
          .get('/testDomainComposr/unregister/juan/palomo')
          .expect(404)
          .end(function(err, response) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
      });

      Promise.all([promiseUnregisterFirstPhrase, promiseUnregisterSecondPhrase])
        .then(function() {
          done();
        })
        .catch(done);
    });
  });
}

module.exports = test;
