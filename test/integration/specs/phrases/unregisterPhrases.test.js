'use strict'
/* globals beforeEach describe it */

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

function test (server) {
  describe('Unregister single phrase', function () {
    var phraseWithTwoParams = {
      url: 'unregister/:name/:surname',
      version: '3.3.3',
      get: {
        code: 'res.status(200).send(req.params);',
        doc: {}
      }
    }

    beforeEach(function (done) {
      server.composr.Phrase.register('testDomainComposr', [phraseWithTwoParams])
        .should.be.eventually.fulfilled.and.notify(done)
    })

    it('can unregister a phrase', function (done) {
      this.timeout(30000)
      // phrase is working
      request(server.app)
        .get('/testDomainComposr/unregister/juan/palomo')
        .expect(200)
        .end(function (err, response) {
          if (err) {
            throw err
          }
          expect(response).to.be.an('object')
          expect(response.body.name).to.equals('juan')
          expect(response.body.surname).to.equals('palomo')
          // phrase is unregistered
          var phraseId = server.composr.Phrase._generateId('unregister/:name/:surname', 'testDomainComposr')
          server.composr.Phrase.unregister('testDomainComposr', phraseId)
          // phrase is not registered
          request(server.app)
            .get('/testDomainComposr/unregister/juan/palomo')
            .expect(404)
            .end(function (err, response) {
              if (err) {
                throw err
              }
              expect(response).to.be.an('object')
              expect(response.status).to.equals(404)
              expect(response.body.error).to.equals('endpoint:not:found')
              expect(response.body.surname).to.equals(undefined)
              done()
            })
        })
    })
  })

  describe('Unregister multiple phrases', function () {
    var phraseWithTwoParams = {
      url: 'unregister/:name/:surname',
      version: '3.3.3',
      get: {
        code: 'res.status(200).send(req.params);',
        doc: {}
      }
    }

    var phraseWithOneParam = {
      url: 'unregister/:name',
      version: '3.3.3',
      get: {
        code: 'res.status(200).send(req.params);',
        doc: {}
      }
    }

    var phrasesRegistered

    beforeEach(function (done) {
      server.composr.Phrase.register('testDomainComposr', [phraseWithTwoParams, phraseWithOneParam])
        .then(function (results) {
          phrasesRegistered = results.map(function (res) {
            return res.model
          })
        })
        .should.notify(done)
    })

    it('can unregister multiple phrases simultaneously', function (done) {
      this.timeout(30000)

      server.composr.Phrase.unregister('testDomainComposr', [phrasesRegistered[0].getId(), phrasesRegistered[1].getId()])

      var promiseUnregisterFirstPhrase = new Promise(function (resolve, reject) {
        request(server.app)
          .get('/testDomainComposr/unregister/juan/palomo')
          .expect(404)
          .end(function (err, response) {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          })
      })
      var promiseUnregisterSecondPhrase = new Promise(function (resolve, reject) {
        request(server.app)
          .get('/testDomainComposr/unregister/juan/palomo')
          .expect(404)
          .end(function (err, response) {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          })
      })

      Promise.all([promiseUnregisterFirstPhrase, promiseUnregisterSecondPhrase])
        .then(function () {
          done()
        })
        .catch(done)
    })
  })
}

module.exports = test
