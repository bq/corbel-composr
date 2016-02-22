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
  var id
  var item
  var engineCustom
  var stubRegisterPhrases
  var stubRegisterSnippets

  beforeEach(function () {
    sandbox = sinon.sandbox.create()

    id = domain + '!' + Date.now()
    item = {
      id: Date.now()
    }

    engineCustom = {}
    engineCustom.composr = {}

    engineCustom.composr.Phrases = {}
    engineCustom.composr.loadPhrase = sandbox.stub().returns(Promise.resolve(item))
    engineCustom.composr.Phrases.register = function () {}
    engineCustom.composr.Phrases.unregister = sandbox.stub()
    engineCustom.composr.addPhrasesToDataStructure = sandbox.stub()
    engineCustom.composr.removePhrasesFromDataStructure = sandbox.stub()
    engineCustom.phrasesCollection = ''

    engineCustom.composr.Snippets = {}
    engineCustom.composr.loadSnippet = sandbox.stub().returns(Promise.resolve(item))
    engineCustom.composr.Snippets.register = function () {}
    engineCustom.composr.Snippets.unregister = sandbox.stub()
    engineCustom.composr.addSnippetsToDataStructure = sandbox.stub()
    engineCustom.composr.removeSnippetsFromDataStructure = sandbox.stub()
    engineCustom.snippetsCollection = ''

    worker = new WorkerClass(engineCustom)
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('an error is returned if Worker is instantiated with an invalid engine', function () {
    var invalidEngine = {}
    expect(function () {
      return new WorkerClass(invalidEngine)
    }).to.throw('error:worker:engine')
  })

  it('an error is returned if Worker is instantiated without engine', function () {
    expect(function () {
      return new WorkerClass()
    }).to.throw('error:worker:engine')
  })

  it('isValidEngine returns true if its sended a valid engine', function () {
    var validEngine = {
      composr: '',
      snippetsCollection: '',
      phrasesCollection: ''
    }

    expect(WorkerClass.prototype.isValidEngine(validEngine)).to.be.equal(true)
  })

  it('isValidEngine returns false if its sended an invalid engine', function () {
    var invalidEngine = {}
    expect(WorkerClass.prototype.isValidEngine(invalidEngine)).to.be.equal(false)
  })

  it('isValidEngine returns false if its called without an engine', function () {
    expect(WorkerClass.prototype.isValidEngine()).to.be.equal(false)
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
    stubRegisterPhrases = sandbox.stub(engineCustom.composr.Phrases, 'register', function (data) {
      return Promise.resolve({registered: true})
    })

    worker._addPhrase(domain, id)
      .then(function (status) {
        expect(status).to.be.equal(true)
        expect(engineCustom.composr.loadPhrase.callCount).to.equals(1)
        expect(engineCustom.composr.loadPhrase.calledWith(id)).to.equals(true)
        expect(stubRegisterPhrases.callCount).to.equals(1)
        expect(stubRegisterPhrases.calledWith(domain, item)).to.equals(true)
        expect(engineCustom.composr.addPhrasesToDataStructure.callCount).to.equals(1)
        expect(engineCustom.composr.addPhrasesToDataStructure.calledWith(item)).to.equals(true)

        done()
      })
  })

  it('_addPhrase method returns false when a phrase is not added', function (done) {
    stubRegisterPhrases = sandbox.stub(engineCustom.composr.Phrases, 'register', function (data) {
      return Promise.resolve({registered: false})
    })

    worker._addPhrase(domain, id)
      .then(function (status) {
        expect(status).to.be.equal(false)
        expect(engineCustom.composr.loadPhrase.callCount).to.equals(1)
        expect(engineCustom.composr.loadPhrase.calledWith(id)).to.equals(true)
        expect(stubRegisterPhrases.callCount).to.equals(1)
        expect(stubRegisterPhrases.calledWith(domain, item)).to.equals(true)
        expect(engineCustom.composr.addPhrasesToDataStructure.callCount).to.equals(0)

        done()
      })
  })

  it('_addSnippet method returns true when a snippet is added', function (done) {
    stubRegisterSnippets = sandbox.stub(engineCustom.composr.Snippets, 'register', function (data) {
      return Promise.resolve({registered: true})
    })

    worker._addSnippet(domain, id)
      .then(function (status) {
        expect(status).to.be.equal(true)
        expect(engineCustom.composr.loadSnippet.callCount).to.equals(1)
        expect(engineCustom.composr.loadSnippet.calledWith(id)).to.equals(true)
        expect(stubRegisterSnippets.callCount).to.equals(1)
        expect(stubRegisterSnippets.calledWith(domain, item)).to.equals(true)
        expect(engineCustom.composr.addSnippetsToDataStructure.callCount).to.equals(1)
        expect(engineCustom.composr.addSnippetsToDataStructure.calledWith(item)).to.equals(true)

        done()
      })
  })

  it('_addSnippet method returns false when a snippet is added', function (done) {
    stubRegisterSnippets = sandbox.stub(engineCustom.composr.Snippets, 'register', function (data) {
      return Promise.resolve({registered: false})
    })

    worker._addSnippet(domain, id)
      .then(function (status) {
        expect(status).to.be.equal(false)
        expect(engineCustom.composr.loadSnippet.callCount).to.equals(1)
        expect(engineCustom.composr.loadSnippet.calledWith(id)).to.equals(true)
        expect(stubRegisterSnippets.callCount).to.equals(1)
        expect(stubRegisterSnippets.calledWith(domain, item)).to.equals(true)
        expect(engineCustom.composr.addSnippetsToDataStructure.callCount).to.equals(0)

        done()
      })
  })

  it('all methods are called inside of _removePhrase', function () {
    worker._removePhrase(domain, id)

    expect(engineCustom.composr.Phrases.unregister.callCount).to.equals(1)
    expect(engineCustom.composr.Phrases.unregister.calledWith(domain, id)).to.equals(true)
    expect(engineCustom.composr.removePhrasesFromDataStructure.callCount).to.equals(1)
    expect(engineCustom.composr.removePhrasesFromDataStructure.calledWith(id)).to.equals(true)
  })

  it('all methods are called inside of _removeSnippet', function () {
    worker._removeSnippet(domain, id)

    expect(engineCustom.composr.Snippets.unregister.callCount).to.equals(1)
    expect(engineCustom.composr.Snippets.unregister.calledWith(domain, id)).to.equals(true)
    expect(engineCustom.composr.removeSnippetsFromDataStructure.callCount).to.equals(1)
    expect(engineCustom.composr.removeSnippetsFromDataStructure.calledWith(id)).to.equals(true)
  })

  it('should call correct method when a delete is requested for a phrase', function () {
    var isPhrase = true
    var action = 'DELETE'
    var stubRemovePhrase = sandbox.stub(worker, '_removePhrase').returns(Promise.resolve())

    worker._doWorkWithPhraseOrSnippet(isPhrase, id, action)

    expect(stubRemovePhrase.callCount).to.equals(1)
    expect(stubRemovePhrase.calledWith(domain, id)).to.equals(true)
  })

  it('should call correct method when a delete is requested for a snippet', function () {
    var isPhrase = false
    var action = 'DELETE'
    var stubRemoveSnippet = sandbox.stub(worker, '_removeSnippet').returns(Promise.resolve())

    worker._doWorkWithPhraseOrSnippet(isPhrase, id, action)

    expect(stubRemoveSnippet.callCount).to.equals(1)
    expect(stubRemoveSnippet.calledWith(domain, id)).to.equals(true)
  })

  it('should call correct method when a create is requested for a phrase', function (done) {
    var isPhrase = true
    var action = 'CREATE'
    var stubAddPhrase = sandbox.stub(worker, '_addPhrase').returns(Promise.resolve())

    worker._doWorkWithPhraseOrSnippet(isPhrase, id, action)

    expect(stubAddPhrase.callCount).to.equals(1)
    expect(stubAddPhrase.calledWith(domain, id)).to.equals(true)
    done()
  })

  it('should call correct method when a update is requested for a phrase', function (done) {
    var isPhrase = true
    var action = 'UPDATE'
    var stubAddPhrase = sandbox.stub(worker, '_addPhrase').returns(Promise.resolve())

    worker._doWorkWithPhraseOrSnippet(isPhrase, id, action)

    expect(stubAddPhrase.callCount).to.equals(1)
    expect(stubAddPhrase.calledWith(domain, id)).to.equals(true)
    done()
  })

  it('should call correct method when a create is requested for a snippet', function (done) {
    var isPhrase = false
    var action = 'CREATE'
    var stubAddSnippet = sandbox.stub(worker, '_addSnippet').returns(Promise.resolve())

    worker._doWorkWithPhraseOrSnippet(isPhrase, id, action)

    expect(stubAddSnippet.callCount).to.equals(1)
    expect(stubAddSnippet.calledWith(domain, id)).to.equals(true)
    done()
  })

  it('should call correct method when a update is requested for a snippet', function (done) {
    var isPhrase = false
    var action = 'UPDATE'
    var stubAddSnippet = sandbox.stub(worker, '_addSnippet').returns(Promise.resolve())

    worker._doWorkWithPhraseOrSnippet(isPhrase, id, action)

    expect(stubAddSnippet.callCount).to.equals(1)
    expect(stubAddSnippet.calledWith(domain, id)).to.equals(true)
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
