'use strict'

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)

function test (server) {
  describe('Path params', function () {
    var phrase = {
      url: 'pathparams/:id/:name',
      version: '3.3.3',
      get: {
        code: 'res.send(200, req.params);',
        doc: {

        }
      }
    }

    before(function (done) {
      server.composr.Phrase.register('testDomainComposr', phrase)
        .should.be.fulfilled.notify(done)
    })

    it('executes the phrase correctly', function (done) {
      this.timeout(30000)

      request(server.app)
        .get('/testDomainComposr/pathparams/1/pepe')
        .expect(200)
        .end(function (err, response) {
          expect(response).to.be.an('object')
          expect(response.body.name).to.equals('pepe')
          expect(response.body.id).to.equals('1')
          done(err)
        })
    })

    it('executes the phrase correctly a second time', function (done) {
      this.timeout(30000)

      request(server.app)
        .get('/testDomainComposr/pathparams/2/pacopepe')
        .expect(200)
        .end(function (err, response) {
          expect(response).to.be.an('object')
          expect(response.body.name).to.equals('pacopepe')
          expect(response.body.id).to.equals('2')
          done(err)
        })
    })
  })
}

module.exports = test
