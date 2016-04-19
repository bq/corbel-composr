'use strict'

var chai = require('chai')
var sinon = require('sinon')
var expect = chai.expect
var mockHook = require('../../../../src/lib/phraseHooks/mockHook')

describe('Mock hook', function () {
  var docTemplate = function (status, schema, example) {
    var doc = {responses: {}}
    doc.responses[status] = {
      body: {
        'application/json': {}
      }
    }

    if (schema) {
      doc.responses[status].body['application/json'].schema = JSON.stringify(schema)
    }
    if (example) {
      doc.responses[status].body['application/json'].example = JSON.stringify(example)
    }
    return doc
  }

  it('Skips the hook if no doc for any response is provided', function () {
    // Setup
    var req = {headers: []}
    var sendSpy = sinon.spy()
    var res = {send: sendSpy}
    var next = sinon.spy()

    var docs = [{},
      {responses: {}},
      {responses: {200: {}}},
      {responses: {200: {body: {}}}},
      {responses: {200: {body: {'application/json': {}}}}}]

    docs.forEach(function (doc) {
      mockHook(doc)(req, res, next)
      expect(next.calledWith()).to.be.true
    })
  })

  it('Skips the hook if no doc for any 2xx response is provided', function () {
    // Setup
    var req = {headers: []}
    var sendSpy = sinon.spy()
    var res = {send: sendSpy}
    var next = sinon.spy()

    var methodDoc = docTemplate(400, null, {home: 'Freemen'})

    mockHook(methodDoc)(req, res, next)

    expect(next.calledWith()).to.be.true
  })

  it('Sends the mocked response for a 200 correct example documentation', function () {
    // Setup
    var req = {headers: []}
    var sendSpy = sinon.spy()
    var res = {send: sendSpy}
    var next = sinon.spy()

    var status = 200
    var example = {result: 30}
    var methodDoc = docTemplate(status, null, example)

    // Call
    mockHook(methodDoc)(req, res, next)

    // Assert
    expect(sendSpy.calledWith(status, example)).to.be.true
  })

  it('Sends the mocked response for a 202 correct example documentation', function () {
    // Setup
    var req = {headers: []}
    var sendSpy = sinon.spy()
    var res = {send: sendSpy}
    var next = sinon.spy()

    var status = 202
    var example = {home: 'Atreides'}
    var methodDoc = docTemplate(status, null, example)

    // Call
    mockHook(methodDoc)(req, res, next)

    // Assert
    expect(sendSpy.calledWith(status, example)).to.be.true
  })

  it('Sends the mocked response for a 200 correct schema documentation', function () {
    // Setup
    var req = {headers: []}
    var sendSpy = sinon.spy()
    var res = {send: sendSpy}
    var next = sinon.spy()

    var status = 200
    var schema = {
      type: 'object',
      properties: {
        page: {
          type: 'number'
        },
        houses: {
          type: 'array',
          uniqueItems: true,
          minItems: 1,
          items: {}
        }
      }
    }
    var methodDoc = docTemplate(status, schema, null)

    // Call
    mockHook(methodDoc)(req, res, next)

    // Assert
    expect(sendSpy.calledOnce).to.be.true
    expect(sendSpy.getCall(0).args[0] === status).to.be.true
    expect(sendSpy.getCall(0).args[1]).to.be.a('object')
  })
})
