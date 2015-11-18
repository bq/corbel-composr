'use strict';

var chai = require('chai'),
  sinon = require('sinon'),
  expect = chai.expect,
  chaiAsPromised = require('chai-as-promised'),
  should = chai.should(),
  WorkerClass = require('../../../src/lib/worker.js');

var worker = new WorkerClass();

chai.use(chaiAsPromised);

describe('Rabbit worker', function() {
  var domain = 'domain';
  var id = domain + '!name';
  var item = {
    id: 42
  };
  var engineCustom;
  var promiseRegisterPhrases;
  var promiseRegisterSnippets;
  var stubRegisterPhrases;
  var stubRegisterSnippets;

  beforeEach(function() {
    engineCustom = {};
    engineCustom.composr = {};
    engineCustom.composr.Phrases = {};
    engineCustom.composr.Phrases.unregister = sinon.stub();
    engineCustom.composr.removePhrasesFromDataStructure = sinon.stub();
    engineCustom.composr.Snippets = {};
    engineCustom.composr.Snippets.unregister = sinon.stub();
    engineCustom.composr.removeSnippetsFromDataStructure = sinon.stub();
    engineCustom.composr.loadPhrase = sinon.stub().returns(Promise.resolve(item));
    engineCustom.composr.Phrases.register = function() {};
    engineCustom.composr.loadSnippet = sinon.stub().returns(Promise.resolve(item));
    engineCustom.composr.Snippets.register = function() {};

    promiseRegisterPhrases = new Promise(function(resolve) {
      stubRegisterPhrases = sinon.stub(engineCustom.composr.Phrases, 'register', function(data) {
        resolve(data);
      });
    });

    promiseRegisterSnippets = new Promise(function(resolve) {
      stubRegisterSnippets = sinon.stub(engineCustom.composr.Snippets, 'register', function(data) {
        resolve(data);
      });
    });

  });

  it('has the expected API', function() {
    expect(worker).to.respondTo('init');
    expect(worker).to.respondTo('_doWorkWithPhraseOrSnippet');
  });

  it('should call correct method in engine when a delete is requested for a phrase', function() {
    var isPhrase = true;
    var action = 'DELETE';

    worker._doWorkWithPhraseOrSnippet(isPhrase, id, action, engineCustom);

    expect(engineCustom.composr.Phrases.unregister.callCount).to.equals(1);
    expect(engineCustom.composr.Phrases.unregister.calledWith(domain, id)).to.equals(true);

    expect(engineCustom.composr.Snippets.unregister.callCount).to.equals(0);
    expect(engineCustom.composr.Snippets.unregister.calledWith(domain, id)).to.equals(false);

    expect(engineCustom.composr.removePhrasesFromDataStructure.callCount).to.equals(1);
    expect(engineCustom.composr.removePhrasesFromDataStructure.calledWith(id)).to.equals(true);

    expect(engineCustom.composr.removeSnippetsFromDataStructure.callCount).to.equals(0);
    expect(engineCustom.composr.removeSnippetsFromDataStructure.calledWith(id)).to.equals(false);
  });

  it('should call correct method in engine when a delete is requested for a snippet', function() {
    var isPhrase = false;
    var action = 'DELETE';

    worker._doWorkWithPhraseOrSnippet(isPhrase, id, action, engineCustom);

    expect(engineCustom.composr.Phrases.unregister.callCount).to.equals(0);
    expect(engineCustom.composr.Phrases.unregister.calledWith('domain', id)).to.equals(false);

    expect(engineCustom.composr.Snippets.unregister.callCount).to.equals(1);
    expect(engineCustom.composr.Snippets.unregister.calledWith('domain', id)).to.equals(true);

    expect(engineCustom.composr.removePhrasesFromDataStructure.callCount).to.equals(0);
    expect(engineCustom.composr.removePhrasesFromDataStructure.calledWith(id)).to.equals(false);
    
    expect(engineCustom.composr.removeSnippetsFromDataStructure.callCount).to.equals(1);
    expect(engineCustom.composr.removeSnippetsFromDataStructure.calledWith(id)).to.equals(true);
  });

  it('should call correct method in engine when a create is requested for a phrase', function(done) {
    var isPhrase = true;
    var action = 'CREATE';

    worker._doWorkWithPhraseOrSnippet(isPhrase, id, action, engineCustom);

    promiseRegisterPhrases.then(function() {
      expect(engineCustom.composr.loadPhrase.callCount).to.equals(1);
      expect(engineCustom.composr.loadPhrase.calledWith(id)).to.equals(true);
      expect(stubRegisterPhrases.callCount).to.equals(1);
      expect(stubRegisterPhrases.calledWith(domain, item)).to.equals(true);

      expect(engineCustom.composr.loadSnippet.callCount).to.equals(0);
      expect(engineCustom.composr.loadSnippet.calledWith(id)).to.equals(false);
      expect(stubRegisterSnippets.callCount).to.equals(0);
      expect(stubRegisterSnippets.calledWith(domain, item)).to.equals(false);
    })
      .should.notify(done);
  });

  it('should call correct method in engine when a update is requested for a phrase', function(done) {
    var isPhrase = true;
    var action = 'UPDATE';

    worker._doWorkWithPhraseOrSnippet(isPhrase, id, action, engineCustom);

    promiseRegisterPhrases.then(function() {
      expect(engineCustom.composr.loadPhrase.callCount).to.equals(1);
      expect(engineCustom.composr.loadPhrase.calledWith(id)).to.equals(true);
      expect(stubRegisterPhrases.callCount).to.equals(1);
      expect(stubRegisterPhrases.calledWith(domain, item)).to.equals(true);

      expect(engineCustom.composr.loadSnippet.callCount).to.equals(0);
      expect(engineCustom.composr.loadSnippet.calledWith(id)).to.equals(false);
      expect(stubRegisterSnippets.callCount).to.equals(0);
      expect(stubRegisterSnippets.calledWith(domain, item)).to.equals(false);
    })
      .should.notify(done);
  });

  it('should call correct method in engine when a create is requested for a snippet', function(done) {
    var isPhrase = false;
    var action = 'CREATE';

    worker._doWorkWithPhraseOrSnippet(isPhrase, id, action, engineCustom);

    promiseRegisterSnippets.then(function() {
      expect(engineCustom.composr.loadSnippet.callCount).to.equals(1);
      expect(engineCustom.composr.loadSnippet.calledWith(id)).to.equals(true);
      expect(stubRegisterSnippets.callCount).to.equals(1);
      expect(stubRegisterSnippets.calledWith(domain, item)).to.equals(true);

      expect(engineCustom.composr.loadPhrase.callCount).to.equals(0);
      expect(engineCustom.composr.loadPhrase.calledWith(id)).to.equals(false);
      expect(stubRegisterPhrases.callCount).to.equals(0);
      expect(stubRegisterPhrases.calledWith(domain, item)).to.equals(false);
    })
      .should.notify(done);
  });

  it('should call correct method in engine when a update is requested for a snippet', function(done) {
    var isPhrase = false;
    var action = 'UPDATE';

    worker._doWorkWithPhraseOrSnippet(isPhrase, id, action, engineCustom);

    promiseRegisterSnippets.then(function() {
      expect(engineCustom.composr.loadSnippet.callCount).to.equals(1);
      expect(engineCustom.composr.loadSnippet.calledWith(id)).to.equals(true);
      expect(stubRegisterSnippets.callCount).to.equals(1);
      expect(stubRegisterSnippets.calledWith(domain, item)).to.equals(true);

      expect(engineCustom.composr.loadPhrase.callCount).to.equals(0);
      expect(engineCustom.composr.loadPhrase.calledWith(id)).to.equals(false);
      expect(stubRegisterPhrases.callCount).to.equals(0);
      expect(stubRegisterPhrases.calledWith(domain, item)).to.equals(false);
    })
      .should.notify(done);
  });

  describe('worker flow', function() {
    var theWorker;
    var promiseCreateChannel;
    var stubCreateChannel;
    var connection = {
      'on' : sinon.stub()
    };

    beforeEach(function() {
      theWorker = new WorkerClass();
      theWorker.connUrl = 'amqp://username:password@host:port';
      theWorker.workerID = 1234;
      theWorker._closeConnectionSIGINT = function() {};
      theWorker._closeConnection = function() {};
      theWorker.retryInit = function() {};
      theWorker._connect = sinon.stub().returns(Promise.resolve(connection));
      theWorker.createChannel = function() {};

      promiseCreateChannel = new Promise(function(resolve) {
        stubCreateChannel = sinon.stub(theWorker, 'createChannel', function(data) {
          resolve(data);
          return promiseCreateChannel;
        });
      });
    });

    it('basic init flow should go well', function(done) {

      theWorker.init(); // subject under test

      promiseCreateChannel.then(function() {
        expect(theWorker._connect.callCount).to.equals(1);
        expect(theWorker._connect.calledWith()).to.equals(true);
        expect(stubCreateChannel.callCount).to.equals(1);
        expect(stubCreateChannel.calledWith(connection)).to.equals(true);
      })
        .should.notify(done);
    });

  });

  //TODO add test for :

  it.skip('retriggers the connection creation if it fails', function() {

  });

  it.skip('Binds to a channel if the connection is stablished', function() {

  });

  it.skip('Parses a phrase event', function() {

  });

  it.skip('Parses a snippet event', function() {

  });
});
