'use strict'

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect

function test (server) {
  describe('When a request to composr takes more than 10 seconds', function () {
    var phrasesToRegister = [{
      'url': 'timeout',
      'get': {
        'code': 'var a = 3; while(true){ a = a + 3; };',
        'doc': {

        }
      }
    }]

    before(function (done) {
      // server.composr.reset()
      server.composr.Phrases.register('testDomain', phrasesToRegister)
        .then(function (results) {
          // console.log(server.composr.data)
          // TODO: reset phrases beforeEach, theres a bug with phrases
          // and snippets registration on composr-core related to
          // the refresh of the data structure
          done()
        })
    })

    it('returns some check statuses in the status page', function (done) {
      request(server.app)
        .get('/status')
        .expect(200)
        .end(function (error, response) {
          expect(response.body).to.be.an('object')
          expect(response.body).to.include.keys(
            'env',
            'domains',
            'version',
            'statuses'
          )
          expect(response.body.statuses.phrasesLoaded).to.be.above(0)
          done(error)
        })
    })

    it('returns some check statuses in the healthcheck page', function (done) {
      request(server.app)
        .get('/healthcheck')
        .end(function (error, response) {
          expect(response.body).to.be.an('object')
          expect(response.body).to.include.keys(
            'env',
            'domains',
            'version',
            'statuses'
          )
          expect(response.body.statuses.phrasesLoaded).to.be.above(0)
          done(error)
        })
    })

    it('returns corbel-js and composr-core version', function (done) {
      request(server.app)
        .get('/version')
        .expect(200)
        .end(function (error, response) {
          expect(response.body).to.be.an('object')
          expect(response.body).to.include.keys(
            'corbel-js',
            'composr-core',
            'version',
            'name'
          )
          done(error)
        })
    })
  })
}

module.exports = test
