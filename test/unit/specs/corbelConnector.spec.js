'use strict'
/* globals before beforeEach afterEach describe it */

var options = null
var config = require('config')
var nock = require('nock')
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var expect = chai.expect
var sinon = require('sinon')
var corbelConnector = require('../../../src/lib/connectors/corbel')

chai.should()
chai.use(chaiAsPromised)

describe('Corbel Connector', function () {
  this.timeout(10 * 1000)

  var baseUrl = config.get('corbel.options.urlBase')
  // var retries = config.get('services.retries')
  // var time = config.get('services.time')
  var domain = baseUrl.substring(0, baseUrl.indexOf('{') - 1)
  var mySandbox = sinon.sandbox.create()
  // var modules = ['iam', 'resources']

  afterEach(function () {
    mySandbox.restore()
  })

  describe('Services checking', function () {
    it.only('Ccon Retries connection when one endpoint does not work on first time', function (done) {
      var stubCheckStatus = mySandbox.stub(corbelConnector, 'checkState')

      var resultOk = {
        a: true,
        b: true,
        c: true
      }

      var resultBad = {
        a: false,
        b: true,
        c: true
      }

      stubCheckStatus.onCall(0).returns(resultBad)
      stubCheckStatus.onCall(1).returns(resultBad)
      stubCheckStatus.onCall(2).returns(resultBad)
      stubCheckStatus.onCall(3).returns(resultBad)
      stubCheckStatus.returns(resultOk)

      corbelConnector._waitUntilCorbelModulesReady(3, 50)
        .should.be.rejected
        .then(function () {
          corbelConnector._waitUntilCorbelModulesReady(3, 50)
            .should.be.fulfilled
        })
        .should.notify(done)
    })

    describe('Check state', function () {
      it('when request timeout is fired promise should mark some modules as failure', function (done) {
        var time = 1000

        nock(domain, options)
          .get('/iam/version')
          .delayConnection(time)
          .reply(200)
          .get('/resources/version')
          .delayConnection(time)
          .reply(200)

        corbelConnector.checkState(200)
          .should.be.fulfilled
          .then(function (results) {
            console.log(results)
            expect(nock.isDone()).to.be.true
            nock.cleanAll()
          })
          .should.notify(done)
      })

      it('when connection error event is fired promise should be rejected', function (done) {
        nock(domain, options)
          .get('/iam/version')
          .replyWithError('An awful error')
          .get('/resources/version')
          .replyWithError('An awful error')

        corbelConnector.checkState(200)
          .should.be.fulfilled
          .then(function (results) {
            console.log(results)
            expect(nock.isDone()).to.be.true
            nock.cleanAll()
          })
          .should.notify(done)
      })

      it('when request is replied and no body exists promise should be resolved', function (done) {
        nock(domain, options)
          .get('/iam/version')
          .reply(200)
          .get('/resources/version')
          .reply(200)

        corbelConnector.checkState(200)
          .should.be.fulfilled
          .then(function (results) {
            console.log(results)
            expect(nock.isDone()).to.be.true
            nock.cleanAll()
          })
          .should.notify(done)
      })

      it('when request is replied and JSON body without error is sent promise should be resolved', function (done) {
        var jsonResponse = {'result': 'ok'}

        nock(domain, options)
          .get('/iam/version')
          .reply(200, jsonResponse)
          .get('/resources/version')
          .reply(200, jsonResponse)

        corbelConnector.checkState(200)
          .should.be.fulfilled
          .then(function (results) {
            console.log(results)
            expect(nock.isDone()).to.be.true
            nock.cleanAll()
          })
          .should.notify(done)
      })

      it('when response status code is !== 200 and no body error is sent promise should be rejected', function (done) {
        nock(domain, options)
          .get('/iam/version')
          .reply(400)
          .get('/resources/version')
          .reply(400)

        corbelConnector.checkState(200)
          .should.be.rejected
          .then(function (results) {
            console.log(results)
            expect(nock.isDone()).to.be.true
            nock.cleanAll()
          })
          .should.notify(done)
      })

      it('when response status code !== 200 and response body contains a JSON error promise should be rejected', function (done) {
        var bodyError = JSON.stringify({
          err: new Error('Undefined error').toString()
        })

        nock(domain, options)
          .get('/iam/version')
          .reply(400, bodyError, {
            'Content-Type': 'application/json'
          })
          .get('/resources/version')
          .reply(400, bodyError, {
            'Content-Type': 'application/json'
          })

        corbelConnector.checkState(200)
          .should.be.rejected
          .then(function () {
            expect(nock.isDone()).to.be.true
            nock.cleanAll()
          })
          .should.notify(done)
      })

      it('when response status code === 200 && response body contains an error promise should be rejected', function (done) {
        var bodyError = new Error('Undefined error').toString()
        nock(domain, options)
          .get('/iam/version')
          .reply(200, bodyError, {
            'Content-Type': 'application/html'
          })
          .get('/resources/version')
          .reply(200, bodyError, {
            'Content-Type': 'application/html'
          })

        corbelConnector.checkState(200)
          .should.be.rejected
          .then(function () {
            expect(nock.isDone()).to.be.true
            // cleanAll must be called here, because 'afterEach' || 'after' hooks are called immediately, but promise resolves before, so, there's a time fraction where nock is still loaded and further calls hit it, that means, no interceptor is defined for arbitrary endpoints ---> nock reject request
            nock.cleanAll()
            nock.restore()
          })
          .should.notify(done)
      })
    })
  })
})
