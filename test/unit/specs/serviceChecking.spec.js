'use strict';

var engine = null,
  options = null,
  config = require('../../../src/lib/config'),
  path = require('path'),
  composr = require('composr-core'),
  https = require('https'),
  nock = require('nock'),
  chai = require('chai'),
  chaiAsPromised = require('chai-as-promised'),
  expect = chai.expect,
  assert = chai.assert,
  fs = require('fs'),
  sinon = require('sinon'),
  engine = require('../../../src/lib/engine.js');

chai.use(chaiAsPromised);

describe('Engine', function() {
  this.timeout(10 * 1000);

  var baseUrl = config('corbel.driver.options').urlBase;
  var retries = config('services.retries');
  var time = config('services.time');
  var domain = baseUrl.substring(0, baseUrl.indexOf("{") - 1);
  var engineAbsPath = null;
  var mySandbox = sinon.sandbox.create();
  var modules = ['iam', 'resources'];

  describe('Services checking', function() {

    before(function() {
      options = {
        allowUnmocked: true
      };
      engineAbsPath = path.resolve(__dirname + '../../../../src/lib/engine.js');
    });

    beforeEach(function() {
      engine = require(engineAbsPath); 
    });

    afterEach(function() {
      mySandbox.restore();
      // Required to allow to create a new instance of 'engine'
      // Every time a 'require' is made, is saved into a local 'require' cache, so to create a new instance every time, 
      // we need to replace cache
      delete require.cache[engineAbsPath];
      });

    describe('Engine', function() {

      it('initialize engine on first time', function(done) {
        var stubOnComposrInit = mySandbox.stub(engine, 'initComposrCore');
        var stubInitServiceChecking = mySandbox.stub(engine, 'initServiceCheckingRequests');

        stubOnComposrInit.returns(Promise.resolve());
        stubInitServiceChecking.returns([Promise.resolve()]);

        engine.launchTries()
          .should.be.fulfilled
          .then(function() {
            engine.initComposrCore(null, true);
          })
          .then(function() {
            expect(stubOnComposrInit.calledOnce).to.be.true;
            expect(stubOnComposrInit.lastCall.args[1] === true).to.be.true;
          })
          .should.notify(done);
      });

      it('not initialize engine when core is not available', function(done) {

        var stubOnComposrInit = mySandbox.stub(engine, 'initComposrCore');
        var stubInitServiceChecking = mySandbox.stub(engine, 'initServiceCheckingRequests');
        var spyWaitTilServicesUp = mySandbox.spy(engine, 'waitTilServicesUp');
        stubOnComposrInit.returns(Promise.reject());
        stubInitServiceChecking.returns([Promise.reject()])

        engine.launchTries(50,3)
          .should.be.rejected
          .then(function() {
            engine.initComposrCore(null, false)
              .should.be.rejected
          })
          .then(function() {
            expect(spyWaitTilServicesUp.callCount === 3).to.be.true;
            expect(stubOnComposrInit.calledOnce).to.be.true;
            expect(stubOnComposrInit.lastCall.args[1] === false).to.be.true;
          })
          .should.notify(done);
      });

      it('initializes engine without data when one endpoint does not work on first time and retries ' + retries + ' times and finally login', function(done) {

        var stubOnComposrInit = mySandbox.stub(engine, 'initComposrCore');
        var stubInitServiceChecking = mySandbox.stub(engine, 'initServiceCheckingRequests');
        var spyWaitTilServicesUp = mySandbox.spy(engine, 'waitTilServicesUp');

        stubInitServiceChecking.onCall(0).returns([Promise.reject()]);
        stubInitServiceChecking.onCall(1).returns([Promise.reject()]);
        stubInitServiceChecking.onCall(2).returns([Promise.reject()]);
        stubInitServiceChecking.onCall(3).returns([Promise.resolve()]);
        stubOnComposrInit.returns(Promise.resolve());

        engine.launchTries(50,3)
          .should.be.rejected
          .then(function() {
            engine.initComposrCore(null, false)
              .should.be.fulfilled
          })
          .then(function() {
            engine.launchTries(50,3)
              .should.be.fulfilled;
          })
          .then(function() {
            engine.initComposrCore(null, true)
              .should.be.fulfilled
          })
          .then(function() {
            expect(stubInitServiceChecking.callCount === 4).to.be.true;
            expect(spyWaitTilServicesUp.callCount === 4).to.be.true;
            expect(stubOnComposrInit.calledTwice).to.be.true;
            expect(stubOnComposrInit.firstCall.args[1] === false).to.be.true;
            expect(stubOnComposrInit.secondCall.args[1] === true).to.be.true;
          })
          .should.notify(done);
      });
    });

    describe('Engine requests', function() {

      it('when request timeout is fired promise should be rejected', function(done) {

        nock(domain, options)
          .get('/iam/version')
          .delayConnection(time)
          .reply(200)
          .get('/resources/version')
          .delayConnection(time)
          .reply(200);
        
        Promise.all(engine.initServiceCheckingRequests(modules, 0))
          .should.be.rejected
           .then(function(){
            expect(nock.isDone()).to.be.true; 
            nock.cleanAll(); 
          })
          .should.notify(done);
      });

      it('when connection error event is fired promise should be rejected', function(done) {

        nock(domain, options)
          .get('/iam/version')
          .replyWithError('An awful error')
          .get('/resources/version')
          .replyWithError('An awful error');

        Promise.all(engine.initServiceCheckingRequests(modules, 0))
          .should.be.rejected
            .then(function(){
            expect(nock.isDone()).to.be.true; 
            nock.cleanAll(); 
          })
         .should.notify(done);
      });

      it('when request is replied and no body exists promise should be resolved', function(done) {

        nock(domain, options)
          .get('/iam/version')
          .reply(200)
          .get('/resources/version')
          .reply(200);

        Promise.all(engine.initServiceCheckingRequests(modules, 5000))
          .should.be.fulfilled
             .then(function(){
            expect(nock.isDone()).to.be.true; 
            nock.cleanAll(); 
          })
        .should.notify(done);
      });

      it('when request is replied and JSON body without error is sent promise should be resolved', function(done) {

        var jsonResponse = {'result': 'ok'}; 

        nock(domain, options)
          .get('/iam/version')
          .reply(200, jsonResponse)
          .get('/resources/version')
          .reply(200, jsonResponse);

        Promise.all(engine.initServiceCheckingRequests(modules, 5000))
          .should.be.fulfilled
              .then(function(){
            expect(nock.isDone()).to.be.true; 
            nock.cleanAll(); 
          })
       .should.notify(done);
      });

      it('when response status code is !== 200 and no body error is sent promise should be rejected', function(done) {

        nock(domain, options)
          .get('/iam/version')
          .reply(400)
          .get('/resources/version')
          .reply(400);

        Promise.all(engine.initServiceCheckingRequests(modules, 0))
          .should.be.rejected
               .then(function(){
            expect(nock.isDone()).to.be.true; 
            nock.cleanAll(); 
          })
      .should.notify(done);
      });

      it('when response status code !== 200 and response body contains a JSON error promise should be rejected', function(done) {

        var bodyError = JSON.stringify({
          err: new Error('Undefined error').toString()
        });

        nock(domain, options)
          .get('/iam/version')
          .reply(400, bodyError, {
            'Content-Type': 'application/json'
          })
          .get('/resources/version')
          .reply(400, bodyError, {
            'Content-Type': 'application/json'
          });

        Promise.all(engine.initServiceCheckingRequests(modules, 0))
          .should.be.rejected
                .then(function(){
            expect(nock.isDone()).to.be.true; 
            nock.cleanAll(); 
          })
     .should.notify(done);
      });

      it('when response status code === 200 && response body contains an error promise should be rejected', function(done) {

        var bodyError = new Error('Undefined error').toString(); 
        nock(domain, options)
         .get('/iam/version')
          .reply(200, bodyError, {
            'Content-Type': 'application/html'
          })
          .get('/resources/version')
          .reply(200, bodyError, {
            'Content-Type': 'application/html'
          });

        Promise.all(engine.initServiceCheckingRequests(modules, 0))
         .should.be.rejected
          .then(function(){
            expect(nock.isDone()).to.be.true;             
            // cleanAll must be called here, because 'afterEach' || 'after' hooks are called immediately, but promise resolves before, so, there's a time fraction where nock is still loaded and further calls hit it, that means, no interceptor is defined for arbitrary endpoints ---> nock reject request
            nock.cleanAll(); 
            nock.restore();
          })  
          .should.notify(done); 
      });
    });

  });
});
