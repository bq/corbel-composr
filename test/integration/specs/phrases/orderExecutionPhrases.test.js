'use strict'
/* globals before describe it */

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

function test (server) {
  describe('Path params', function () {
    var phraseWithTwoParams = {
      url: 'user/:name/:surname',
      get: {
        code: 'res.status(200).send({ surname: req.params.surname, name : req.params.name });',
        doc: {}
      }
    }

    var phraseWithOneParamAndOneConstant = {
      url: 'user/:name/surname',
      get: {
        code: 'res.status(200).send({ surname: "constant", name : req.params.name });',
        doc: {}
      }
    }
    var phraseWithOneParam = {
      url: 'user/:name',
      get: {
        code: 'res.status(201).send(req.params);',
        doc: {}
      }
    }
    var phraseWithOneConstant = {
      url: 'user/name',
      get: {
        code: 'res.status(200).send({ name: "constant"});',
        doc: {}
      }
    }

    before(function (done) {
      server.composr.Phrases.register('testDomainComposr', [phraseWithOneConstant, phraseWithOneParam, phraseWithOneParamAndOneConstant, phraseWithTwoParams])
        .should.be.eventually.fulfilled.and.notify(done)
    })

    it('should use phrase with two params', function (done) {
      request(server.app)
        .get('/testDomainComposr/user/juan/palomo')
        .expect(200)
        .end(function (err, response) {
          expect(response).to.be.an('object')
          expect(response.body.name).to.equals('juan')
          expect(response.body.surname).to.equals('palomo')
          done(err)
        })
    })

    it('should use phrase with one param and one constant', function (done) {
      request(server.app)
        .get('/testDomainComposr/user/juan/surname')
        .expect(200)
        .end(function (err, response) {
          expect(response).to.be.an('object')
          expect(response.body.name).to.equals('juan')
          expect(response.body.surname).to.equals('constant')
          done(err)
        })
    })

    it('should use phrase with one param', function (done) {
      request(server.app)
        .get('/testDomainComposr/user/juan')
        .expect(201)
        .end(function (err, response) {
          expect(response).to.be.an('object')
          expect(response.body.name).to.equals('juan')
          done(err)
        })
    })

    it('should use phrase with one constant', function (done) {
      request(server.app)
        .get('/testDomainComposr/user/name')
        .expect(200)
        .end(function (err, response) {
          expect(response).to.be.an('object')
          expect(response.body.name).to.equals('constant')
          done(err)
        })
    })
  })
}

module.exports = test
