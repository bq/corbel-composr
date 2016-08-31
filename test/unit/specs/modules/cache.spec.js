'use strict'
/* globals describe it */

var chai = require('chai')
var corbel = require('corbel-js')
var expect = chai.expect
var cacheModule = require('../../../../src/lib/modules/cache')
var tokenVerifier = require('corbel-token-verifier')

describe('Cache module unit test', function () {
  var userAccessToken, clientAccessToken

  before(function () {
    var optUser = {
      iss: 1,
      aud: 'a',
      userId: 'abc',
      clientId: '54313'
    }

    var optClient = {
      iss: 1,
      aud: 'a',
      clientId: '54313'
    }

    userAccessToken = tokenVerifier(corbel.jwt.generate(optUser, 'asd'))
    clientAccessToken = tokenVerifier(corbel.jwt.generate(optClient, 'asd'))
  })

  it('Generates a good key for a user token', function () {
    var key = cacheModule.getKey('/user/me?query=hi', 'get', userAccessToken, '0.0.0', 'user')
    expect(key).to.equals('abc-0.0.0-get-/user/me?query=hi')
  })

  it('Generates a client key for a user token if cache type is client', function () {
    var key = cacheModule.getKey('/user/me?query=hi', 'get', userAccessToken, '0.0.0', 'client')
    expect(key).to.equals('54313-0.0.0-get-/user/me?query=hi')
  })

  it('Generates a good key for a client token', function () {
    var key = cacheModule.getKey('/user/me?query=hi', 'get', clientAccessToken, '0.0.0')
    expect(key).to.equals('54313-0.0.0-get-/user/me?query=hi')
  })

  it('Generates a good key for a request without token', function () {
    var key = cacheModule.getKey('/user/me?query=hi', 'get', null, '0.0.0')
    expect(key).to.equals('no-token-0.0.0-get-/user/me?query=hi')
  })

  it('Generates a no-token key for a request with undefined token', function () {
    var key = cacheModule.getKey('/user/me?query=hi', 'get', undefined, '0.0.0')
    expect(key).to.equals('no-token-0.0.0-get-/user/me?query=hi')
  })
})
