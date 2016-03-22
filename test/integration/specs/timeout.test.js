'use strict'
/* globals before describe it */

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect

function test (server) {
  describe('When a request to composr takes more than 10 seconds', function () {
    var phrasesToRegister = [{
      'url': 'timeout',
      'version': '2.3.4',
      'get': {
        'code': 'var a = 3; while(true){ a = a + 3; };',
        'doc': {

        }
      }
    }]

    before(function (done) {
      server.composr.Phrase.register('testDomain', phrasesToRegister)
        .then(function (results) {
          done()
        })
    })

    it('it fails with a 503 error', function (done) {
      this.timeout(30000)

      request(server.app)
        .get('/testDomain/timeout')
        .set('accept-version', '<3.0.0')
        .expect(503)
        .end(function (error, response) {
          expect(response).to.be.an('object')
          expect(response.body.status).to.equals(503)
          expect(response.body.error).to.equals('error:phrase:timedout:timeout')
          if (response.statusCode === 503) {
            return done()
          } else {
            return done(error || response)
          }
        })
    })
  })
}

module.exports = test
