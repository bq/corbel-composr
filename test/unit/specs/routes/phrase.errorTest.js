'use strict'
/* globals beforeEach afterEach describe it */

var chai = require('chai')
var sinon = require('sinon')
var expect = chai.expect
var chaiAsPromised = require('chai-as-promised')
var Phrase = require('../../../../src/routes/phrase.js').Phrase

chai.use(chaiAsPromised)

describe('Phrase upsert, delete and get Errors', function () {
  var sandbox
  var stubGetAuthorization
  var stubGetDriver
  var stubGetDomain
  var stubPublishAvailability
  var stubValidate
  var stubEmitEvent

  var req = {
    body: {
      id: 'test',
      url: ''
    },
    params: {
      itemId: 'deleteId'
    }
  }
  var auth = {
    auth: 'testAuth'
  }
  var driver = 'driver'
  var domain = 'domain'
  var fullId = 'deleteId'

  beforeEach(function () {
    sandbox = sinon.sandbox.create()

    stubGetAuthorization = sandbox.stub(Phrase, 'getAuthorization', function () {
      return auth
    })
    stubGetDriver = sandbox.stub(Phrase, 'getDriver', function () {
      return driver
    })
    stubGetDomain = sandbox.stub(Phrase, 'getDomain', function () {
      return domain
    })
    stubEmitEvent = sandbox.stub(Phrase, 'emitEvent')
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('Phrase.upsert throws an error in publishAvailability', function (done) {
    stubPublishAvailability = sandbox.stub(Phrase, 'checkPublishAvailability', function () {
      return Promise.reject({
        status: 401
      })
    })

    Phrase.upsert(req, {
      send: function (status) {
        expect(status).to.be.equal(401)
        expect(stubGetAuthorization.callCount).to.equals(1)
        expect(stubGetAuthorization.calledWith(req)).to.equals(true)
        expect(stubGetDriver.callCount).to.equals(1)
        expect(stubGetDriver.calledWith(auth)).to.equals(true)
        expect(stubGetDomain.callCount).to.equals(1)
        expect(stubGetDomain.calledWith(auth)).to.equals(true)
        expect(stubPublishAvailability.callCount).to.equals(1)
        expect(stubPublishAvailability.calledWith(driver)).to.equals(true)

        done()
      }
    })
  })

  it('Phrase.upsert throws an error in validate', function (done) {
    var error = {
      errors: ''
    }
    stubPublishAvailability = sandbox.stub(Phrase, 'checkPublishAvailability', function () {
      return Promise.resolve()
    })
    stubValidate = sandbox.stub(Phrase.manager, 'validate', function () {
      return Promise.reject(error)
    })

    Phrase.upsert(req, {
      send: function (status) {
        expect(status).to.be.equal(422)
        expect(stubGetAuthorization.callCount).to.equals(1)
        expect(stubGetAuthorization.calledWith(req)).to.equals(true)
        expect(stubGetDriver.callCount).to.equals(1)
        expect(stubGetDriver.calledWith(auth)).to.equals(true)
        expect(stubGetDomain.callCount).to.equals(1)
        expect(stubGetDomain.calledWith(auth)).to.equals(true)
        expect(stubPublishAvailability.callCount).to.equals(1)
        expect(stubPublishAvailability.calledWith(driver)).to.equals(true)
        expect(stubValidate.callCount).to.equals(1)
        expect(stubValidate.calledWith(req.body)).to.equals(true)

        done()
      }
    })
  })

  it('Phrase.upsert throws an error in upsertCall', function (done) {
    var error = {
      status: 408
    }
    stubPublishAvailability = sandbox.stub(Phrase, 'checkPublishAvailability', function () {
      return Promise.resolve()
    })
    stubValidate = sandbox.stub(Phrase, 'validate', function () {
      return Promise.resolve()
    })
    var stubUpsertCall = sandbox.stub(Phrase, 'upsertCall').returns(Promise.reject(error))

    Phrase.upsert(req, {
      send: function (status) {
        expect(status).to.be.equal(408)
        expect(stubGetAuthorization.callCount).to.equals(1)
        expect(stubGetAuthorization.calledWith(req)).to.equals(true)
        expect(stubGetDriver.callCount).to.equals(1)
        expect(stubGetDriver.calledWith(auth)).to.equals(true)
        expect(stubGetDomain.callCount).to.equals(1)
        expect(stubGetDomain.calledWith(auth)).to.equals(true)
        expect(stubPublishAvailability.callCount).to.equals(1)
        expect(stubPublishAvailability.calledWith(driver)).to.equals(true)
        expect(stubValidate.callCount).to.equals(1)
        expect(stubValidate.calledWith(req.body)).to.equals(true)
        expect(stubEmitEvent.callCount).to.equals(0)
        expect(stubUpsertCall.callCount).to.equals(1)
        expect(stubUpsertCall.calledWith(domain, req.body)).to.equals(true)
        done()
      }
    })
  })

  it('Phrase.delete throws an error in deleteCall', function (done) {
    var error = {
      status: 408,
      message: 'testError'
    }
    var stubDeleteCall = sandbox.stub(Phrase, 'deleteCall').returns(Promise.reject(error))

    sandbox.stub(Phrase, 'checkPublishAvailability', function () {
      return Promise.resolve()
    })

    sandbox.stub(Phrase, 'getItemById', function () {
      return {
        getDomain: function () {
          return domain
        }
      }
    })

    Phrase.delete(req, {
      send: function (status) {
        expect(status).to.be.equal(408)
        expect(stubGetAuthorization.callCount).to.equals(1)
        expect(stubGetAuthorization.calledWith(req)).to.equals(true)
        expect(stubGetDriver.callCount).to.equals(1)
        expect(stubGetDriver.calledWith(auth)).to.equals(true)
        expect(stubGetDomain.callCount).to.equals(1)
        expect(stubGetDomain.calledWith(auth)).to.equals(true)
        expect(stubDeleteCall.callCount).to.equals(1)
        expect(stubDeleteCall.calledWith(fullId)).to.equals(true)

        done()
      }
    })
  })

  it('Phrase.get throws an error in getCall if the phrase does not exists', function (done) {
    var stubGetCall = sandbox.stub(Phrase, 'getItemById').returns(undefined)

    Phrase.get(req, {
      send: function (status) {
        expect(status).to.be.equal(404)
        expect(stubGetAuthorization.callCount).to.equals(1)
        expect(stubGetAuthorization.calledWith(req)).to.equals(true)
        expect(stubGetDomain.callCount).to.equals(1)
        expect(stubGetDomain.calledWith(auth)).to.equals(true)
        expect(stubGetCall.callCount).to.equals(1)
        expect(stubGetCall.calledWith(fullId)).to.equals(true)

        done()
      }
    })
  })

  it('Phrase.get throws an error if there are not authorization and domain', function (done) {
    stubGetDomain.restore()
    stubGetDomain = sandbox.stub(Phrase, 'getDomain', function () {
      return undefined
    })
    stubGetAuthorization.restore()
    stubGetAuthorization = sandbox.stub(Phrase, 'getAuthorization', function () {
      return undefined
    })

    Phrase.get(req, {
      send: function (status) {
        expect(status).to.be.equal(401)
        expect(stubGetAuthorization.callCount).to.equals(1)
        expect(stubGetAuthorization.calledWith(req)).to.equals(true)
        expect(stubGetDomain.callCount).to.equals(1)
        expect(stubGetDomain.calledWith(undefined)).to.equals(true)

        done()
      }
    })
  })

  it('Phrase.getAll throws an error if there is no domain', function (done) {
    stubGetDomain.restore()
    stubGetDomain = sandbox.stub(Phrase, 'getDomain', function () {
      return undefined
    })

    Phrase.getAll(req, {
      send: function (status) {
        expect(status).to.be.equal(401)
        expect(stubGetAuthorization.callCount).to.equals(1)
        expect(stubGetAuthorization.calledWith(req)).to.equals(true)
        expect(stubGetDomain.callCount).to.equals(1)
        expect(stubGetDomain.calledWith(auth)).to.equals(true)

        done()
      }
    })
  })
})
