'use strict';

var chai = require('chai'),
  sinon = require('sinon'),
  expect = chai.expect,
  chaiAsPromised = require('chai-as-promised'),
  should = chai.should(),
  WorkerClass = require('../../../../src/lib/rabbitMQworker.js');

var worker;

chai.use(chaiAsPromised);

describe('Rabbit worker', function() {
  var domain = 'domain';
  var id;
  var item;
  var engineCustom;
  var promiseRegisterPhrases;
  var promiseRegisterSnippets;
  var stubRegisterPhrases;
  var stubRegisterSnippets;

  beforeEach(function() {
    id = domain + '!' + Date.now();
    item = {
      id: Date.now()
    };

    engineCustom = {};
    engineCustom.composr = {};
    engineCustom.composr.Phrases = {};
    engineCustom.composr.Phrases.unregister = sinon.stub();
    engineCustom.composr.addPhrasesToDataStructure = sinon.stub()
    engineCustom.composr.removePhrasesFromDataStructure = sinon.stub();
    engineCustom.composr.Snippets = {};
    engineCustom.composr.Snippets.unregister = sinon.stub();
    engineCustom.composr.addSnippetsToDataStructure = sinon.stub()
    engineCustom.composr.removeSnippetsFromDataStructure = sinon.stub();
    engineCustom.composr.loadPhrase = sinon.stub().returns(Promise.resolve(item));
    engineCustom.composr.Phrases.register = function() {};
    engineCustom.composr.loadSnippet = sinon.stub().returns(Promise.resolve(item));
    engineCustom.composr.Snippets.register = function() {};
    engineCustom.snippetsCollection = '';
    engineCustom.phrasesCollection =  '';

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
    worker = new WorkerClass(engineCustom);

  });

  it('an error is returned if Worker is instantiated with an invalid engine', function() {
      var invalidEngine = {};
      expect(function(){
          return new WorkerClass(invalidEngine);
      }).to.throw('error:worker:engine');
  });

  it('an error is returned if Worker is instantiated without engine', function() {
      expect(function(){
          return new WorkerClass();
      }).to.throw('error:worker:engine');
  });

  it('isValidEngine returns true if its sended a valid engine', function() {
      var validEngine = {
        composr: '',
        snippetsCollection: '',
        phrasesCollection: ''
      };

      expect(WorkerClass.prototype.isValidEngine(validEngine)).to.be.equal(true);
  });

  it('isValidEngine returns false if its sended an invalid engine', function() {
      var invalidEngine = {};
      expect(WorkerClass.prototype.isValidEngine(invalidEngine)).to.be.equal(false);
  });

  it('isValidEngine returns false if its called without an engine', function() {
      expect(WorkerClass.prototype.isValidEngine()).to.be.equal(false);
  });

  it('isPhrase returns false if its sended an invalid type', function() {
      expect(WorkerClass.prototype.isPhrase('invalid')).to.be.equal(false);
  });

  it('isPhrase returns true if its sended a valid type', function() {
      expect(WorkerClass.prototype.isPhrase('composr:Phrase')).to.be.equal(true);
  });

  it('isSnippet returns false if its sended an invalid type', function() {
      expect(WorkerClass.prototype.isSnippet('invalid')).to.be.equal(false);
  });

  it('isSnippet returns true if its sended a valid type', function() {
      expect(WorkerClass.prototype.isSnippet('composr:Snippet')).to.be.equal(true);
  });

  it('has the expected API', function() {
    expect(worker).to.respondTo('init');
    expect(worker).to.respondTo('_doWorkWithPhraseOrSnippet');
  });

  it('_addPhrase method returns true when a phrase is added', function(){
    worker._addPhrase(domain, id)
        .then(function(status){
            expect(status).to.be.equal(true);
            return promiseRegisterPhrases;
        })
        .then(function(){
          expect(engineCustom.composr.loadPhrase.callCount).to.equals(1);
          expect(engineCustom.composr.loadPhrase.calledWith(id)).to.equals(true);
          expect(stubRegisterPhrases.callCount).to.equals(1);
          expect(stubRegisterPhrases.calledWith(domain, item)).to.equals(true);
          expect(engineCustom.composr.addPhrasesToDataStructure.calledWith(item)).to.equals(true);
        });
  });

  it('_addPhrase method returns false when a phrase is not added', function(){
    var result = {
      'registered': false
    };
    var engine = {
      composr: {},
      snippetsCollection: '',
      phrasesCollection: ''
    };
    engine.composr.Phrases = {};
    engine.composr.Phrases.register = sinon.stub().returns(Promise.resolve(result));
    engine.composr.loadPhrase = sinon.stub().returns(Promise.resolve());
    engine.composr.addSnippetsToDataStructure = sinon.stub();

    var customWorker = new WorkerClass(engine);

    customWorker._addPhrase(domain, id)
        .then(function(status){
          expect(status).to.be.equal(false);
          expect(engine.composr.loadPhrase.callCount).to.equals(1);
          expect(engine.composr.loadPhrase.calledWith(id)).to.equals(true);
          expect(engine.composr.Phrases.register.callCount).to.equals(1);
          expect(engine.composr.Phrases.register.calledWith(domain, item)).to.equals(true);
          expect(engine.composr.addPhrasesToDataStructure.callCount).to.equals(0);
        });
  });

  it('_addSnippet method returns true when a snippet is added', function(){
    worker._addSnippet(domain, id)
        .then(function(status){
            expect(status).to.be.equal(true);
            return promiseRegisterPhrases;
        })
        .then(function(){
          expect(engineCustom.composr.loadSnippet.callCount).to.equals(0);
          expect(engineCustom.composr.loadSnippet.calledWith(id)).to.equals(false);
          expect(stubRegisterSnippets.callCount).to.equals(0);
          expect(stubRegisterSnippets.calledWith(domain, item)).to.equals(false);
          expect(engineCustom.composr.addSnippetsToDataStructure.calledWith(item)).to.equals(true);
        });
  });

  it('_addSnippet method returns false when a snippet is added', function(){
    var result = {
      'registered': false
    };
    var engine = {
      composr: {},
      snippetsCollection: '',
      phrasesCollection: ''
    };
    engine.composr.Snippets = {};
    engine.composr.Snippets.register = sinon.stub().returns(Promise.resolve(result));
    engine.composr.loadSnippet = sinon.stub().returns(Promise.resolve());
    engine.composr.addSnippetsToDataStructure = sinon.stub();

    var customWorker = new WorkerClass(engine);

    customWorker._addSnippet(domain, id)
        .then(function(status){
          expect(status).to.be.equal(false);
          expect(engine.composr.loadSnippet.callCount).to.equals(1);
          expect(engine.composr.loadSnippet.calledWith(id)).to.equals(true);
          expect(engine.composr.Snippets.register.callCount).to.equals(1);
          expect(engine.composr.Snippets.register.calledWith(domain, item)).to.equals(true);
          expect(engine.composr.addSnippetsToDataStructure.callCount).to.equals(0);
        });
  });

  it('all methods are called inside of _removePhrase', function(){
    worker._removePhrase(domain, id);

    promiseRegisterPhrases
    .then(function(){
          expect(engineCustom.composr.Phrases.unregister.calledWith(domain, id)).to.equals(true);
          expect(engineCustom.composr.removePhrasesFromDataStructure.calledWith(id)).to.equals(true);
        });
  });

  it('all methods are called inside of _removeSnippet', function(){
    worker._removePhrase(domain, id);

    promiseRegisterPhrases
    .then(function(){
          expect(engineCustom.composr.Snippets.unregister.calledWith(domain, id)).to.equals(true);
          expect(engineCustom.composr.removeSnippetsFromDataStructure.calledWith(id)).to.equals(true);
        });
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

  it('connection is closed correctly', function(){
      var connection = {
        'close' : sinon.stub()
      };

      worker._closeConnection(connection);

      expect(connection.close.callCount).to.be.equals(1);
      expect(worker.connectionStatus).to.be.equals(false);
  });

  it('worker create channel make correct calls', function(done) {
      var worker;
      var engine = {
        composr: '',
        snippetsCollection: '',
        phrasesCollection: ''
      };
      var channel = {};
      var connection = {
        'createChannel' : sinon.stub().returns(Promise.resolve(channel))
      };

      worker = new WorkerClass(engine);

      worker.assertQueue = sinon.stub().returns(Promise.resolve());
      worker.bindQueue = sinon.stub().returns(Promise.resolve());
      worker.consumeChannel = sinon.stub().returns(Promise.resolve());

      worker.createChannel(connection)
      .then(function(){
        var queue = worker.assertQueue.getCall(0).args[1];

        expect(worker.assertQueue.callCount).to.equals(1);
        expect(worker.assertQueue.calledWith(channel, worker.bindQueue.getCall(0).args[1])).to.equals(true);
        expect(worker.bindQueue.callCount).to.equals(1);
        expect(worker.bindQueue.calledWith(channel, queue)).to.equals(true);
        expect(worker.consumeChannel.callCount).to.equals(1);
        expect(worker.consumeChannel.calledWith(channel, queue)).to.equals(true);
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
      var engine = {
        composr: '',
        snippetsCollection: '',
        phrasesCollection: ''
      };
      theWorker = new WorkerClass(engine);
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
