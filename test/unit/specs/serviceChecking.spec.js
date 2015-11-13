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
  sinon = require('sinon');
chai.use(chaiAsPromised);

describe('Engine', function() {
  this.timeout(900 * 1000);

  var baseUrl = config('corbel.driver.options').urlBase;
  var domain = baseUrl.substring(0, baseUrl.indexOf("{") - 1);
  var modules = ['iam', 'resources'];
  var mySandbox = null;
  var retries = config('services.retries');
  var time = config('services.time');
  var requestTimeout = config('services.timeout');
  var engineAbsPath = null;

  describe('Services checking', function() {

    before(function() {
      options = {
        allowUnmocked: true
      };
      engineAbsPath = path.resolve(__dirname + '../../../../src/lib/engine.js');
    });

    beforeEach(function() {
      mySandbox = sinon.sandbox.create();
      engine = require(engineAbsPath);
    });

    afterEach(function() {
      mySandbox.restore();
      nock.cleanAll();
      // Required to allow to create a new instance of 'engine'
      delete require.cache[engineAbsPath];
    });

    it('resolves before timeout', function(done) {

      var spyOnComposrInit = mySandbox.spy(engine, 'initComposrCore');

      nock(domain, options)
        .get('/iam/v1.0/version')
        .reply(200)
        .get('/resources/v1.0/version')
        .reply(200)
        .post('iam/v1.0/oauth/token')
        .reply(200);

      engine.init({})
        .then(function(data) {
          expect(spyOnComposrInit.calledOnce).to.be.true;
        })
        .should.notify(done);
    });

    it('rejects one endpoint and it should retry upto ' + retries + ' times and finally login', function(done) {

      var scope = null;
      var spyOnServicesUp = mySandbox.spy(engine, 'waitTilServicesUp');
      var spyOnComposrInit = mySandbox.spy(engine, 'initComposrCore');
      var spyOnTemporalRetry = mySandbox.spy(engine, 'launchTemporalRetry');

      scope = nock(domain, options)
        .post('iam/v1.0/oauth/token')
        .reply(200)
        .get('/iam/v1.0/version')
        .times(retries)
        .delayConnection(requestTimeout + 100)
        .reply(200)
        .get('/resources/v1.0/version')
        .times(retries)
        .reply(200);

      engine.init({})
        .should.be.fulfilled
        .then(function() {
          engine.abort();
          setTimeout(function() {
            expect(spyOnServicesUp.callCount > retries).to.be.true;
            expect(typeof spyOnComposrInit.args[0][0] === 'object').to.be.true;
            expect(spyOnComposrInit.args[0][1] === false).to.be.true;
            expect(spyOnComposrInit.calledTwice).to.be.true;
            expect(spyOnTemporalRetry.calledOnce).to.be.true;
            done();
          }, time * retries * 2);
        });
    });

    it('rejects two endpoints and it should retry upto ' + retries + ' times and finally login', function(done) {

      var scope = null;
      var spyOnServicesUp = mySandbox.spy(engine, 'waitTilServicesUp');
      var spyOnComposrInit = mySandbox.spy(engine, 'initComposrCore');
      var spyOnTemporalRetry = mySandbox.spy(engine, 'launchTemporalRetry');

      scope = nock(domain, options)
        .post('iam/v1.0/oauth/token')
        .reply(200)
        .get('/iam/v1.0/version')
        .delayConnection(requestTimeout + 100)
        .times(retries)
        .reply(200)
        .get('/resources/v1.0/version')
        .delayConnection(requestTimeout + 100)
        .times(retries)
        .reply(200);

      engine.init({})
        .should.be.fulfilled
        .then(function() {
          engine.abort();
          setTimeout(function() {
            expect(spyOnServicesUp.callCount > retries).to.be.true;
            expect(typeof spyOnComposrInit.args[0][0] === 'object').to.be.true;
            expect(spyOnComposrInit.args[0][1] === false).to.be.true;
            expect(spyOnComposrInit.calledTwice).to.be.true;
            expect(spyOnTemporalRetry.calledOnce).to.be.true;
            done();
          }, time * retries * 2);
        });
    });

    // This must be last test, because cannot stop 'engine' workflow 
    it('rejects two endpoints and it should retry infinite times', function(done) {

      var scope = null;
      var spyOnServicesUp = mySandbox.spy(engine, 'waitTilServicesUp');
      var spyOnComposrInit = mySandbox.spy(engine, 'initComposrCore');
      var spyOnTemporalRetry = mySandbox.spy(engine, 'launchTemporalRetry');

      scope = nock(domain, options)
        .post('iam/v1.0/oauth/token')
        .reply(200)
        .get('/iam/v1.0/version')
        .delayConnection(requestTimeout + 100)
        .reply(200)
        .get('/resources/v1.0/version')
        .delayConnection(requestTimeout + 100)
        .reply(200);

      engine.init({})
        .should.be.fulfilled
        .then(function() {
          setTimeout(function() {
            console.log(spyOnServicesUp.callCount); 
            console.log(retries); 
            expect(spyOnServicesUp.callCount > retries).to.be.true;
            expect(typeof spyOnComposrInit.args[0][0] === 'object').to.be.true;
            expect(spyOnComposrInit.args[0][1] === false).to.be.true;
            expect(spyOnComposrInit.calledOnce).to.be.true;
            expect(spyOnTemporalRetry.callCount >= retries-1).to.be.true;
            done();
          }, time * retries * 10); 
        }); 
    });
  });
});