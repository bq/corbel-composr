'use strict'
/* globals  afterEach describe it */

var chai = require('chai')
var sinon = require('sinon')
var expect = chai.expect
var chaiAsPromised = require('chai-as-promised')
var engine = require('../../../../src/lib/engine.js')
var hub = require('../../../../src/lib/hub.js')
var nock = require('nock')
var config = require('config')

chai.use(chaiAsPromised)

describe('Engine tests', function () {
  var sandbox = sinon.sandbox.create()

  var baseUrl = config.get('corbel.options.urlBase')
  var servicesUrl = baseUrl.substring(0, baseUrl.indexOf('{') - 1)

  afterEach(function () {
    sandbox.restore()
  })

  it('listens the core phrase events', function (done) {
    engine.suscribeToCoreEvents()
    hub.once('create:routes', function (phrase) {
      expect(phrase.getId()).to.be.defined
      done()
    })

    engine.composr.Phrase.register('testDomain', {
      url: 'a/b',
      version: '1.2.4',
      get: {
        code: 'console.log(1);',
        doc: {

        }
      }
    })
  })

  it('Resolves in local mode without data', function (done) {
    var stub = sandbox.stub(engine, 'launchWithoutData', function (app, dfd) {
      dfd.resolve()
    })

    hub.removeAllListeners()

    engine.init(true, true, 'abc1')
      .then(function () {
        hub.removeAllListeners()
        expect(stub.callCount).to.equals(1)
        done()
      })
  })

  it('calls launchWithData if all the services are running', function (done) {
    this.timeout(5000)

    var stubLaunchWithData = sandbox.stub(engine, 'launchWithData', function (app, dfd) {
      dfd.resolve()
    })

    hub.removeAllListeners()

    nock(servicesUrl)
      .get('/iam/version')
      .reply(200)
      .get('/assets/version')
      .reply(200)
      .get('/evci/version')
      .reply(200)
      .get('/resources/version')
      .reply(200)

    engine.init(true, false, 'abc2')
      .then(function () {
        expect(stubLaunchWithData.callCount).to.equals(1)
        expect(nock.isDone()).to.be.true
        done()
      })
  })

  it('calls launchWithOutData if some service is not running', function (done) {
    this.timeout(10000)

    var stubLaunchWithoutData = sandbox.stub(engine, 'launchWithoutData', function (app, dfd) {
      dfd.resolve()
    })

    sandbox.stub(engine, 'initWorker')

    hub.removeAllListeners()

    nock(servicesUrl)
      .get('/iam/version')
      .reply(400)
      .get('/assets/version')
      .reply(400)
      .get('/evci/version')
      .reply(200)
      .get('/resources/version')
      .reply(200)

    engine.init(true, false, 'abcdfe', 2)
      .then(function () {
        expect(stubLaunchWithoutData.callCount).to.be.equals(1)
        nock.cleanAll()
        done()
      })
  })
})
