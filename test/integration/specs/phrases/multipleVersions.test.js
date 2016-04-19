'use strict'

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect

function test (server) {
  describe('Multiple Phrase versions', function () {
    var phraseMe_1 = {
      url: 'multiple/path',
      version: '1.1.1',
      get: {
        code: 'res.status(200).send("me")',
        doc: {}
      }
    }

    var phraseMe_2 = {
      url: 'multiple/path',
      version: '1.2.1',
      get: {
        code: 'res.status(200).send("you")',
        doc: {}
      }
    }

    var phraseMe_3 = {
      url: 'multiple/path',
      version: '2.1.1',
      get: {
        code: 'res.status(200).send("him")',
        doc: {}
      }
    }

    var phraseMe_4 = {
      url: 'multiple/path',
      version: '3.0.0',
      get: {
        code: 'res.status(200).send("her")',
        doc: {}
      }
    }

    before(function (done) {
      var phrases = [
        phraseMe_1,
        phraseMe_2,
        phraseMe_3,
        phraseMe_4
      ]

      server.composr.Phrase.register('testDomainComposr', phrases)
        .should.be.eventually.fulfilled.and.notify(done)
    })

    it('returns the value of the HIGHEST version', function (done) {
      request(server.app)
        .get('/testDomainComposr/multiple/path')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.be.equals('her')
          done(err)
        })
    })

    it('returns the correct version if specified', function (done) {
      request(server.app)
        .get('/testDomainComposr/multiple/path')
        .set('Accept-Version', '2.1.1')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.equals('him')
          done(err)
        })
    })

    it('returns the 2.X version ', function (done) {
      request(server.app)
        .get('/testDomainComposr/multiple/path')
        .set('Accept-Version', '2.*')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.equals('him')
          done(err)
        })
    })
  })
}

module.exports = test
