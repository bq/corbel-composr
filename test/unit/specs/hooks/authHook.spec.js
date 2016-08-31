'use strict'
/* globals describe it */

var chai = require('chai')
var sinon = require('sinon')
var expect = chai.expect
var corbel = require('corbel-js')
var tokenVerifier = require('corbel-token-verifier')

var userToken, clientToken
var authHook = require('../../../../src/lib/phraseHooks/corbelAuthHook')

describe('Auth hook', function () {
  var requestWith = function (authHeader) {
    var header = sinon.stub()
    header.withArgs('Authorization').returns(authHeader)
    return {header: header, tokenObject: tokenVerifier(authHeader)}
  }

  var userId = '999-fff-!'

  before(function () {
    var optUser = {
      iss: 1,
      aud: 'a',
      userId: userId,
      clientId: '54313'
    }

    var optClient = {
      iss: 1,
      aud: 'a',
      clientId: '54313'
    }

    userToken = corbel.jwt.generate(optUser, 'asd')
    clientToken = corbel.jwt.generate(optClient, 'asd')
  })

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
        expect(error.error).to.equal('error:unauthorized')
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
      expect(error.error).to.equal('unauthorized:token')
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
        expect(error.error).to.equal('error:unauthorized')
      })
    })
  })
})
