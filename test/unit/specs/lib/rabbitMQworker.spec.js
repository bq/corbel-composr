'use strict'
/* globals beforeEach afterEach describe it */

var chai = require('chai')
var sinon = require('sinon')
var expect = chai.expect
var chaiAsPromised = require('chai-as-promised')
var WorkerClass = require('../../../../src/lib/rabbitMQworker.js')

chai.use(chaiAsPromised)

describe('Rabbit worker', function () {
  var sandbox
  var worker
  var domain = 'domain'
  var engineCustom

  beforeEach(function () {
    sandbox = sinon.sandbox.create()

    engineCustom = {}
    engineCustom.composr = {}

    engineCustom.composr.Phrase = {}
    engineCustom.composr.Phrase.load = function (item) { return Promise.resolve(item) }
    engineCustom.composr.Phrase.register = function () {}
    engineCustom.composr.Phrase.unregister = sandbox.stub()
    engineCustom.phrasesCollection = ''

    engineCustom.composr.Snippet = {}
    engineCustom.composr.Snippet.load = function (item) { return Promise.resolve(item) }
    engineCustom.composr.Snippet.register = function () {}
    engineCustom.composr.Snippet.unregister = sandbox.stub()
    engineCustom.snippetsCollection = ''

    worker = new WorkerClass(engineCustom)
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('isPhrase returns false if its sended an invalid type', function () {
    expect(WorkerClass.prototype.isPhrase('invalid')).to.be.equal(false)
  })

  it('isPhrase returns true if its sended a valid type', function () {
    expect(WorkerClass.prototype.isPhrase('composr:Phrase')).to.be.equal(true)
  })

  it('isSnippet returns false if its sended an invalid type', function () {
    expect(WorkerClass.prototype.isSnippet('invalid')).to.be.equal(false)
  })

  it('isSnippet returns true if its sended a valid type', function () {
    expect(WorkerClass.prototype.isSnippet('composr:Snippet')).to.be.equal(true)
  })

  it('has the expected API', function () {
    expect(worker).to.respondTo('init')
    expect(worker).to.respondTo('_doWorkWithPhraseOrSnippet')
  })

  it('_addPhrase method returns true when a phrase is added', function (done) {
    sandbox.stub(engineCustom.composr.Phrase, 'load', function (data) {
      return Promise.resolve({registered: true, id: 1})
    })

    worker._addPhrase(domain, domain + '!id')
      .then(function (status) {
        expect(status).to.equals(true)
        expect(engineCustom.composr.Phrase.load.callCount).to.equals(1)
        expect(engineCustom.composr.Phrase.load.calledWith(domain + '!id')).to.equals(true)
        done()
      })
  })

  it('_addPhrase method returns false when a phrase is not added', function (done) {
    sandbox.stub(engineCustom.composr.Phrase, 'load', function (data) {
      return Promise.resolve({registered: false, id: 'ey'})
    })

    worker._addPhrase(domain, domain + '!id')
      .then(function (status) {
        expect(status).to.be.equal(false)
        expect(engineCustom.composr.Phrase.load.callCount).to.equals(1)
        expect(engineCustom.composr.Phrase.load.calledWith(domain + '!id')).to.equals(true)
        done()
      })
  })

  it('_addSnippet method returns true when a snippet is added', function (done) {
    sandbox.stub(engineCustom.composr.Snippet, 'load', function (data) {
      return Promise.resolve({registered: true, id: 'snippet'})
    })

    worker._addSnippet(domain, domain + '!id')
      .then(function (status) {
        expect(status).to.be.equal(true)
        expect(engineCustom.composr.Snippet.load.callCount).to.equals(1)
        expect(engineCustom.composr.Snippet.load.calledWith(domain + '!id')).to.equals(true)
        done()
      })
  })

  it('_addSnippet method returns false when a snippet is added', function (done) {
    sandbox.stub(engineCustom.composr.Snippet, 'load', function (data) {
      return Promise.resolve({registered: false, id: 'snippet'})
    })

    worker._addSnippet(domain, domain + '!id')
      .then(function (status) {
        expect(status).to.be.equal(false)
        expect(engineCustom.composr.Snippet.load.callCount).to.equals(1)
        expect(engineCustom.composr.Snippet.load.calledWith(domain + '!id')).to.equals(true)
        done()
      })
  })

  it('all methods are called inside of _removePhrase', function () {
    worker._removePhrase(domain, domain + '!id')

    expect(engineCustom.composr.Phrase.unregister.callCount).to.equals(1)
    expect(engineCustom.composr.Phrase.unregister.calledWith(domain, domain + '!id')).to.equals(true)
  })

  it('all methods are called inside of _removeSnippet', function () {
    worker._removeSnippet(domain, domain + '!id')

    expect(engineCustom.composr.Snippet.unregister.callCount).to.equals(1)
    expect(engineCustom.composr.Snippet.unregister.calledWith(domain, domain + '!id')).to.equals(true)
  })

  it('should call correct method when a delete is requested for a phrase', function () {
    var isPhrase = true
    var action = 'DELETE'
    var stubRemovePhrase = sandbox.stub(worker, '_removePhrase').returns(Promise.resolve())

    worker._doWorkWithPhraseOrSnippet(isPhrase, domain + '!id', action)

    expect(stubRemovePhrase.callCount).to.equals(1)
    expect(stubRemovePhrase.calledWith(domain, domain + '!id')).to.equals(true)
  })

  it('should call correct method when a delete is requested for a snippet', function () {
    var isPhrase = false
    var action = 'DELETE'
    var stubRemoveSnippet = sandbox.stub(worker, '_removeSnippet').returns(Promise.resolve())

    worker._doWorkWithPhraseOrSnippet(isPhrase, domain + '!id', action)

    expect(stubRemoveSnippet.callCount).to.equals(1)
    expect(stubRemoveSnippet.calledWith(domain, domain + '!id')).to.equals(true)
  })

  it('should call correct method when a create is requested for a phrase', function (done) {
    var isPhrase = true
    var action = 'CREATE'
    var stubAddPhrase = sandbox.stub(worker, '_addPhrase').returns(Promise.resolve())

    worker._doWorkWithPhraseOrSnippet(isPhrase, domain + '!id', action)

    expect(stubAddPhrase.callCount).to.equals(1)
    expect(stubAddPhrase.calledWith(domain, domain + '!id')).to.equals(true)
    done()
  })

  it('should call correct method when a update is requested for a phrase', function (done) {
    var isPhrase = true
    var action = 'UPDATE'
    var stubAddPhrase = sandbox.stub(worker, '_addPhrase').returns(Promise.resolve())

    worker._doWorkWithPhraseOrSnippet(isPhrase, domain + '!id', action)

    expect(stubAddPhrase.callCount).to.equals(1)
    expect(stubAddPhrase.calledWith(domain, domain + '!id')).to.equals(true)
    done()
  })

  it('should call correct method when a create is requested for a snippet', function (done) {
    var isPhrase = false
    var action = 'CREATE'
    var stubAddSnippet = sandbox.stub(worker, '_addSnippet').returns(Promise.resolve())

    worker._doWorkWithPhraseOrSnippet(isPhrase, domain + '!id', action)

    expect(stubAddSnippet.callCount).to.equals(1)
    expect(stubAddSnippet.calledWith(domain, domain + '!id')).to.equals(true)
    done()
  })

  it('should call correct method when a update is requested for a snippet', function (done) {
    var isPhrase = false
    var action = 'UPDATE'
    var stubAddSnippet = sandbox.stub(worker, '_addSnippet').returns(Promise.resolve())

    worker._doWorkWithPhraseOrSnippet(isPhrase, domain + '!id', action)

    expect(stubAddSnippet.callCount).to.equals(1)
    expect(stubAddSnippet.calledWith(domain, domain + '!id')).to.equals(true)
    done()
  })

  it('connection is closed correctly', function () {
    var connection = {
      'close': sinon.stub()
    }

    worker._closeConnection(connection)

    expect(connection.close.callCount).to.be.equals(1)
    expect(worker.connectionStatus).to.be.equals(false)
  })

  it('worker create channel make correct calls', function (done) {
    var worker
    var engine = {
      composr: '',
      snippetsCollection: '',
      phrasesCollection: ''
    }
    var channel = {}
    var connection = {
      'createChannel': sinon.stub().returns(Promise.resolve(channel))
    }

    worker = new WorkerClass(engine)

    worker.assertQueue = sinon.stub().returns(Promise.resolve())
    worker.bindQueue = sinon.stub().returns(Promise.resolve())
    worker.consumeChannel = sinon.stub().returns(Promise.resolve())

    worker.createChannel(connection)
      .then(function () {
        var queue = worker.assertQueue.getCall(0).args[1]

        expect(worker.assertQueue.callCount).to.equals(1)
        expect(worker.assertQueue.calledWith(channel, worker.bindQueue.getCall(0).args[1])).to.equals(true)
        expect(worker.bindQueue.callCount).to.equals(1)
        expect(worker.bindQueue.calledWith(channel, queue)).to.equals(true)
        expect(worker.consumeChannel.callCount).to.equals(1)
        expect(worker.consumeChannel.calledWith(channel, queue)).to.equals(true)

        done()
      })
  })

  describe('worker flow', function () {
    var theWorker
    var promiseCreateChannel
    var stubCreateChannel
    var connection = {
      'on': sinon.stub(),
      'once': sinon.stub()
    }

    beforeEach(function () {
      var engine = {
        composr: '',
        snippetsCollection: '',
        phrasesCollection: ''
      }
      theWorker = new WorkerClass(engine)
      theWorker.connUrl = 'amqp://username:password@host:port'
      theWorker.workerID = 1234
      theWorker._closeConnectionSIGINT = function () {}
      theWorker._closeConnection = function () {}
      theWorker.retryInit = function () {}
      theWorker._connect = sinon.stub().returns(Promise.resolve(connection))
      theWorker.createChannel = function () {}

      promiseCreateChannel = new Promise(function (resolve) {
        stubCreateChannel = sinon.stub(theWorker, 'createChannel', function (data) {
          resolve(data)
          return promiseCreateChannel
        })
      })
    })

    it('basic init flow should go well', function (done) {
      theWorker.init() // subject under test

      promiseCreateChannel
        .then(function () {
          expect(theWorker._connect.callCount).to.equals(1)
          expect(theWorker._connect.calledWith()).to.equals(true)
          expect(stubCreateChannel.callCount).to.equals(1)
          expect(stubCreateChannel.calledWith(connection)).to.equals(true)

          done()
        })
    })
  })

  // TODO add test for :

  it.skip('retriggers the connection creation if it fails', function () {})

  it.skip('Binds to a channel if the connection is stablished', function () {})

  it.skip('Parses a phrase event', function () {})

  it.skip('Parses a snippet event', function () {})
})
