'use strict'
/* globals  afterEach describe it */

var chai = require('chai')
var sinon = require('sinon')
var expect = chai.expect
var chaiAsPromised = require('chai-as-promised')
var engine = require('../../../../src/lib/engine.js')
var hub = require('../../../../src/lib/hub.js')

chai.use(chaiAsPromised)

describe('Engine', function () {
  var sandbox = sinon.sandbox.create()

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
})
