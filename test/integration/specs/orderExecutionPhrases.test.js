'use strict';
var request = require('supertest'),
chai = require('chai'),
expect = chai.expect,
chaiAsPromised = require('chai-as-promised'),
should = chai.should();
chai.use(chaiAsPromised);

function test(server) {
  describe('Path params', function() {
    var phraseWithTwoParams = {
      url: 'user/:name/:surname',
      get: {
        code: 'res.status(200).send(req.params);',
        doc: {}
      }
    };
    var phraseWithOneParamAndOneConstant = {
      url: 'user/:name/surname',
      get: {
        code: 'res.status(200).send({ surname: "constant", name : req.params.name });',
        doc: {}
      }
    };
    var phraseWithOneParam = {
      url: 'user/:name',
      get: {
        code: 'res.status(200).send(req.params);',
        doc: {}
      }
    };
    var phraseWithOneConstant = {
      url: 'user/name',
      get: {
        code: 'res.status(200).send({ name: "constant"});',
        doc: {}
      }
    };

    before(function(done) {
      server.composr.Phrases.register('testDomainComposr', phraseWithOneConstant)
      .should.be.eventually.fulfilled
      .then(function() {
        return server.composr.Phrases.register('testDomainComposr', phraseWithOneParam)
        .should.be.eventually.fulfilled;
      })
      .then(function() {
        return server.composr.Phrases.register('testDomainComposr', phraseWithOneParamAndOneConstant)
        .should.be.eventually.fulfilled;
      })
      .then(function() {
        return server.composr.Phrases.register('testDomainComposr', phraseWithTwoParams)
        .should.be.eventually.fulfilled;
      })
      .then(function() {
        done();
      });
    });

    it('executes the phrase correctly', function(done) {
      request(server.app)
      .get('/testDomainComposr/user/juan/palomo')
      .expect(200)
      .end(function(err, response) {
        expect(response).to.be.an('object');
        expect(response.body.name).to.equals('juan');
        expect(response.body.surname).to.equals('palomo');
        done(err);
      });
    });

    it('executes the phrase correctly', function(done) {
      request(server.app)
      .get('/testDomainComposr/user/juan/surname')
      .expect(200)
      .end(function(err, response) {
        console.log(response.body);
        expect(response).to.be.an('object');
        expect(response.body.name).to.equals('juan');
        expect(response.body.surname).to.equals('constant');
        done(err);
      });
    });

    it('executes the phrase correctly', function(done) {
      request(server.app)
      .get('/testDomainComposr/user/juan')
      .expect(200)
      .end(function(err, response) {
        console.log(response.body);
        expect(response).to.be.an('object');
        expect(response.body.name).to.equals('juan');
        done(err);
      });
    });

    it('executes the phrase correctly', function(done) {
      request(server.app)
      .get('/testDomainComposr/user/name')
      .expect(200)
      .end(function(err, response) {
        console.log(response.body);
        expect(response).to.be.an('object');
        expect(response.body.name).to.equals('constant');
        done(err);
      });
    });

  });
}

module.exports = test;
