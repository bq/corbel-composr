'use strict'
/* globals describe it */

var chai = require('chai')
var corbel = require('corbel-js')
var expect = chai.expect
var cacheModule = require('../../../../src/lib/modules/cache')

describe.only('Cache module unit test', function () {
  var userAccessToken, clientAccessToken

  before(function () {
    var optUser = {
      iss: 1,
      aud: 'a',
      userId: 'abc'
    }

    var optClient = {
      iss: 1,
      aud: 'a',
      clientId: '54313'
    }

    userAccessToken = corbel.jwt.generate(optUser, 'asd')
    clientAccessToken = corbel.jwt.generate(optClient, 'asd')
  })

  it('Generates a good key for a user token', function () {
    var key = cacheModule.getKey('/user/me?query=hi', 'get', userAccessToken, '0.0.0')
    expect(key).to.equals('abc-get-/user/me?query=hi-0.0.0')
  })

  it('Generates a good key for a user token with Bearer', function () {
    var key = cacheModule.getKey('/user/me?query=hi', 'get', 'Bearer ' + userAccessToken, '0.0.0')
    expect(key).to.equals('abc-get-/user/me?query=hi-0.0.0')
  })

  it('Generates a good key for a client token', function () {
    var key = cacheModule.getKey('/user/me?query=hi', 'get', clientAccessToken, '0.0.0')
    expect(key).to.equals('54313-get-/user/me?query=hi-0.0.0')
  })

  it('Generates a good key for a client token with Bearer', function () {
    var key = cacheModule.getKey('/user/me?query=hi', 'get', 'Bearer ' + clientAccessToken, '0.0.0')
    expect(key).to.equals('54313-get-/user/me?query=hi-0.0.0')
  })

  it('Generates a good key for a request without token', function () {
    var key = cacheModule.getKey('/user/me?query=hi', 'get', 'Bearer ', '0.0.0')
    expect(key).to.equals('no-token-get-/user/me?query=hi-0.0.0')
  })

  it('Generates a no-token key for a request with malformed token', function () {
    var key = cacheModule.getKey('/user/me?query=hi', 'get', 'Bearer ASDASD', '0.0.0')
    expect(key).to.equals('no-token-get-/user/me?query=hi-0.0.0')
  })

  it('Generates a no-token key for a request with undefined token', function () {
    var key = cacheModule.getKey('/user/me?query=hi', 'get', undefined, '0.0.0')
    expect(key).to.equals('no-token-get-/user/me?query=hi-0.0.0')
  })
})
