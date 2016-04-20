'use strict'
/* globals describe it */

var chai = require('chai')
var sinon = require('sinon')
var expect = chai.expect
var proxyquire = require('proxyquire')

// We set up the SUT (authHook) with a mocked corbel instance
var userId = '1111'
var clientToken = 'clientAccessToken'
var userToken = 'userAccessToken'

var decodeStub = sinon.stub()
decodeStub.withArgs(clientToken).returns({})
decodeStub.withArgs(userToken).returns({userId: userId})
decodeStub.throws(new Error())
var corbelMock = {
  jwt: {decode: decodeStub}
}
var authHook = proxyquire('../../../../src/lib/phraseHooks/corbelAuthHook', {'corbel-js': corbelMock})

describe('Auth hook', function () {
  var requestWith = function (authHeader) {
    var header = sinon.stub()
    header.withArgs('Authorization').returns(authHeader)
    return {header: header}
  }

  describe('for user', function () {
    it('Successful user login', function () {
      var req = requestWith('Bearer ' + userToken)
      var res = {}
      var next = sinon.spy()

      authHook.authUser()(req, res, next)
      expect(next.calledWith()).to.be.true
      expect(req.userId).to.exist
      expect(req.userId).to.equals(userId)
    })

    it('401 undefined without Auth header', function () {
      var reqs = [
        requestWith(),
        requestWith('')
      ]

      reqs.forEach(function (req) {
        var res = {}
        var next = sinon.spy()

        authHook.authUser()(req, res, next)
        expect(next.calledOnce).to.be.true
        var error = next.args[0][0]
        expect(error).to.exist
        expect(error.error).to.equal('error:authorization:undefined')
      })
    })

    it('401 unauthorized for client token', function () {
      var req = requestWith('Bearer ' + clientToken)
      var res = {}
      var next = sinon.spy()

      authHook.authUser()(req, res, next)
      expect(next.calledOnce).to.be.true
      var error = next.args[0][0]
      expect(error).to.exist
      expect(error.error).to.equal('unauthorized_token')
    })

    it('400 for malformed auth token', function () {
      var reqs = [
        requestWith('Bearer'),
        requestWith('Bearer aaaaaa')
      ]

      reqs.forEach(function (req) {
        var res = {}
        var next = sinon.spy()

        authHook.authUser()(req, res, next)
        expect(next.calledOnce).to.be.true
        var error = next.args[0][0]
        expect(error).to.exist
        expect(error.error).to.equal('error:jwt:malformed')
      })
    })
  })

  describe('for client', function () {
    it('Successful client login', function () {
      var req = requestWith('Bearer ' + clientToken)
      var res = {}
      var next = sinon.spy()

      authHook.authClient()(req, res, next)
      expect(next.calledWith()).to.be.true
      expect(req.userId).to.not.exist
    })

    it('Successful user login', function () {
      var req = requestWith('Bearer ' + userToken)
      var res = {}
      var next = sinon.spy()

      authHook.authClient()(req, res, next)
      expect(next.calledWith()).to.be.true
      expect(req.userId).to.not.exist
    })

    it('401 undefined without Auth header', function () {
      var reqs = [
        requestWith(),
        requestWith('')
      ]

      reqs.forEach(function (req) {
        var res = {}
        var next = sinon.spy()

        authHook.authClient()(req, res, next)
        expect(next.calledOnce).to.be.true
        var error = next.args[0][0]
        expect(error).to.exist
        expect(error.error).to.equal('error:authorization:undefined')
      })
    })

    it('400 for malformed auth token', function () {
      var reqs = [
        requestWith('Bearer'),
        requestWith('Bearer aaaaaa')
      ]

      reqs.forEach(function (req) {
        var res = {}
        var next = sinon.spy()

        authHook.authClient()(req, res, next)
        expect(next.calledOnce).to.be.true
        var error = next.args[0][0]
        expect(error).to.exist
        expect(error.error).to.equal('error:jwt:malformed')
      })
    })
  })
})
