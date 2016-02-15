'use strict'
/* globals beforeEach afterEach describe it */

var chai = require('chai')
var sinon = require('sinon')
var expect = chai.expect
var chaiAsPromised = require('chai-as-promised')
var Snippet = require('../../../../src/routes/snippet.js').Snippet

chai.use(chaiAsPromised)

describe('Snippet upsert and delete', function () {
  var sandbox
  var stubGetCorbelErrorBody
  var stubGetAuthorization
  var stubGetDriver
  var stubGetDomain
  var stubPublishAvailability
  var stubValidate
  var stubEmitEvent
  var stubUpsertCall
  var stubDeleteCall

  var req = {
    body: {
      id: 'test'
    },
    params: {
      snippetId: 'deleteId'
    }
  }
  var res = {
    status: 200,
    data: 'test finished'
  }
  var auth = {
    auth: 'testAuth'
  }
  var driver = 'driver'
  var domain = 'domain'
  var fullId = 'domain!deleteId'
  var textEvent = 'snippet:upsert'
  var errorBody = 'ErrorBody'

  beforeEach(function () {
    sandbox = sinon.sandbox.create()

    stubGetCorbelErrorBody = sandbox.stub(Snippet, 'getCorbelErrorBody', function () {
      return errorBody
    })
    stubGetAuthorization = sandbox.stub(Snippet, 'getAuthorization', function () {
      return auth
    })
    stubGetDriver = sandbox.stub(Snippet, 'getDriver', function () {
      return driver
    })
    stubGetDomain = sandbox.stub(Snippet, 'getDomain', function () {
      return domain
    })
    stubEmitEvent = sandbox.stub(Snippet, 'emitEvent')
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('Snippet.upsert throws an error in publishAvailability', function (done) {
    var error = 'error'
    stubPublishAvailability = sandbox.stub(Snippet, 'checkPublishAvailability', function () {
      return Promise.reject(error)
    })

    Snippet.upsert(req, {
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
        expect(stubGetCorbelErrorBody.callCount).to.equals(1)
        expect(stubGetCorbelErrorBody.calledWith(error)).to.equals(true)

        done()
      }
    })
  })

  it('Snippet.upsert throws an error in validate', function (done) {
    var error = {
      errors: ''
    }
    stubPublishAvailability = sandbox.stub(Snippet, 'checkPublishAvailability', function () {
      return Promise.resolve()
    })
    stubValidate = sandbox.stub(Snippet, 'validate', function () {
      return Promise.reject(error)
    })

    Snippet.upsert(req, {
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

  it('Snippet.upsert throws an error in upsertCall', function (done) {
    var error = {
      status: 408
    }
    stubPublishAvailability = sandbox.stub(Snippet, 'checkPublishAvailability', function () {
      return Promise.resolve()
    })
    stubValidate = sandbox.stub(Snippet, 'validate', function () {
      return Promise.resolve()
    })
    stubUpsertCall = sandbox.stub(Snippet, 'upsertCall').returns(Promise.reject(error))

    Snippet.upsert(req, {
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
        expect(stubEmitEvent.callCount).to.equals(1)
        expect(stubEmitEvent.calledWith(textEvent, domain, req.body.id)).to.equals(true)
        expect(stubUpsertCall.callCount).to.equals(1)
        expect(stubUpsertCall.calledWith(req.body.id, req.body)).to.equals(true)
        expect(stubGetCorbelErrorBody.callCount).to.equals(1)
        expect(stubGetCorbelErrorBody.calledWith(error)).to.equals(true)

        done()
      }
    })
  })

  it('Snippet.delete throws an error in deleteCall', function (done) {
    var error = {
      status: 408,
      message: 'testError'
    }
    stubDeleteCall = sandbox.stub(Snippet, 'deleteCall').returns(Promise.reject(error))
    Snippet.delete(req, res, function () {
      expect(stubGetAuthorization.callCount).to.equals(1)
      expect(stubGetAuthorization.calledWith(req)).to.equals(true)
      expect(stubGetDriver.callCount).to.equals(1)
      expect(stubGetDriver.calledWith(auth)).to.equals(true)
      expect(stubDeleteCall.callCount).to.equals(1)
      expect(stubDeleteCall.calledWith(driver, fullId)).to.equals(true)

      done()
    })
  })
})
