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

  beforeEach(function () {
    sandbox = sinon.sandbox.create()

    stubGetAuthorization = sandbox.stub(Snippet, 'getAuthorization', function () {
      return auth
    })
    stubGetDriver = sandbox.stub(Snippet, 'getDriver', function () {
      return driver
    })
    stubGetDomain = sandbox.stub(Snippet, 'getDomain', function () {
      return domain
    })
    stubPublishAvailability = sandbox.stub(Snippet, 'checkPublishAvailability', function () {
      return Promise.resolve()
    })
    stubValidate = sandbox.stub(Snippet, 'validate', function () {
      return Promise.resolve()
    })
    stubEmitEvent = sandbox.stub(Snippet, 'emitEvent')
    stubUpsertCall = sandbox.stub(Snippet, 'upsertCall').returns(Promise.resolve(res))
    stubDeleteCall = sandbox.stub(Snippet, 'deleteCall').returns(Promise.resolve(res))
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('getCorbelErrorBody is called with a string and returns a string', function (done) {
    expect(Snippet.getCorbelErrorBody('test')).to.be.equal('test')
    done()
  })

  it('getCorbelErrorBody is called with an object and returns a json parsed correctly', function (done) {
    var dataObj = {
      data: {
        body: '{"error": "errorTest"}'
      }
    }

    var parsedData = {
      error: 'errorTest'
    }

    expect(Snippet.getCorbelErrorBody(dataObj)).to.be.deep.equal(parsedData)
    done()
  })

  it('getCorbelErrorBody is called with an object and returns the same object', function (done) {
    var dataObj = {
      data: {
        body: {
          error: 'errorTest'
        }
      }
    }

    expect(Snippet.getCorbelErrorBody(dataObj)).to.be.equal(dataObj)
    done()
  })

  it('Snippet.getFullId returns complete id', function (done) {
    expect(Snippet.getFullId(domain, req.body.id)).to.be.equals('domain!test')
    done()
  })

  it('Snippet.upsert works correctly', function (done) {
    Snippet.upsert(req, {
      send: function (status) {
        expect(status).to.be.equal(200)
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

        done()
      }
    })
  })

  it('Snippet.delete works correctly', function (done) {
    Snippet.delete(req, {
      send: function (status) {
        expect(status).to.be.equal(200)
        expect(stubGetAuthorization.callCount).to.equals(1)
        expect(stubGetAuthorization.calledWith(req)).to.equals(true)
        expect(stubGetDriver.callCount).to.equals(1)
        expect(stubGetDriver.calledWith(auth)).to.equals(true)
        expect(stubGetDomain.callCount).to.equals(1)
        expect(stubGetDomain.calledWith(auth)).to.equals(true)
        expect(stubDeleteCall.callCount).to.equals(1)
        expect(stubDeleteCall.calledWith(driver, fullId)).to.equals(true)

        done()
      }
    })
  })
})
