'use strict';

var chai = require('chai'),
  sinon = require('sinon'),
  expect = chai.expect,
  chaiAsPromised = require('chai-as-promised'),
  should = chai.should(),
  Phrase = require('../../../../src/routes/phrase.js').Phrase;

chai.use(chaiAsPromised);

describe('Phrase upsert, delete and get', function() {
  var sandbox;
  var stubGetCorbelErrorBody;
  var stubGetAuthorization;
  var stubGetDriver;
  var stubGetDomain;
  var stubPublishAvailability;
  var stubValidate;
  var stubEmitEvent;

  var req = {
    body: {
      id: 'test',
      url: ''
    },
    params: {
      phraseId: 'deleteId'
    }
  };
  var res = {
    status: 200,
    data: 'test finished'
  };
  var next = {
      error: 'error'
  };
  var auth = {
    auth: 'testAuth'
  };
  var driver = 'driver';
  var domain = 'domain';
  var fullId = 'domain!deleteId';
  var textEvent = 'phrase:upsert';
  var errorBody = 'ErrorBody';

  beforeEach(function() {
    sandbox = sinon.sandbox.create();

    stubGetCorbelErrorBody = sandbox.stub(Phrase, 'getCorbelErrorBody', function(){
        return errorBody;
    });
    stubGetAuthorization = sandbox.stub(Phrase, 'getAuthorization', function(){
        return auth;
    });
    stubGetDriver = sandbox.stub(Phrase, 'getDriver', function(){
        return driver;
    });
    stubGetDomain = sandbox.stub(Phrase, 'getDomain', function(){
        return domain;
    });
    stubEmitEvent = sandbox.stub(Phrase, 'emitEvent');
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('Phrase.upsert throws an error in publishAvailability', function(done) {
      var error = 'error';
      stubPublishAvailability = sandbox.stub(Phrase, 'checkPublishAvailability', function(){
          return Promise.reject(error);
      });

      Phrase.upsert(req, { send : function(status){

        expect(status).to.be.equal(401);
        expect(stubGetAuthorization.callCount).to.equals(1);
        expect(stubGetAuthorization.calledWith(req)).to.equals(true);
        expect(stubGetDriver.callCount).to.equals(1);
        expect(stubGetDriver.calledWith(auth)).to.equals(true);
        expect(stubGetDomain.callCount).to.equals(1);
        expect(stubGetDomain.calledWith(auth)).to.equals(true);
        expect(stubPublishAvailability.callCount).to.equals(1);
        expect(stubPublishAvailability.calledWith(driver)).to.equals(true);
        expect(stubGetCorbelErrorBody.callCount).to.equals(1);
        expect(stubGetCorbelErrorBody.calledWith(error)).to.equals(true);

        done();
      }});

     });

  it('Phrase.upsert throws an error in validate', function(done) {
      var error = {
        errors: ''
      }
      stubPublishAvailability = sandbox.stub(Phrase, 'checkPublishAvailability', function(){
          return Promise.resolve();
      });
      stubValidate = sandbox.stub(Phrase, 'validate', function(){
          return Promise.reject(error);
      });

      Phrase.upsert(req, { send : function(status){

        expect(status).to.be.equal(422);
        expect(stubGetAuthorization.callCount).to.equals(1);
        expect(stubGetAuthorization.calledWith(req)).to.equals(true);
        expect(stubGetDriver.callCount).to.equals(1);
        expect(stubGetDriver.calledWith(auth)).to.equals(true);
        expect(stubGetDomain.callCount).to.equals(1);
        expect(stubGetDomain.calledWith(auth)).to.equals(true);
        expect(stubPublishAvailability.callCount).to.equals(1);
        expect(stubPublishAvailability.calledWith(driver)).to.equals(true);
        expect(stubValidate.callCount).to.equals(1);
        expect(stubValidate.calledWith(req.body)).to.equals(true);

        done();
      }});

     });

  it('Phrase.upsert throws an error in upsertCall', function(done) {
      var error = {
        status: 408
      }
      stubPublishAvailability = sandbox.stub(Phrase, 'checkPublishAvailability', function(){
          return Promise.resolve();
      });
      stubValidate = sandbox.stub(Phrase, 'validate', function(){
          return Promise.resolve();
      });
      var stubUpsertCall = sandbox.stub(Phrase, 'upsertCall').returns(Promise.reject(error));

      Phrase.upsert(req, { send : function(status){

        expect(status).to.be.equal(408);
        expect(stubGetAuthorization.callCount).to.equals(1);
        expect(stubGetAuthorization.calledWith(req)).to.equals(true);
        expect(stubGetDriver.callCount).to.equals(1);
        expect(stubGetDriver.calledWith(auth)).to.equals(true);
        expect(stubGetDomain.callCount).to.equals(1);
        expect(stubGetDomain.calledWith(auth)).to.equals(true);
        expect(stubPublishAvailability.callCount).to.equals(1);
        expect(stubPublishAvailability.calledWith(driver)).to.equals(true);
        expect(stubValidate.callCount).to.equals(1);
        expect(stubValidate.calledWith(req.body)).to.equals(true);
        expect(stubEmitEvent.callCount).to.equals(1);
        expect(stubEmitEvent.calledWith(textEvent, domain, req.body.id)).to.equals(true);
        expect(stubUpsertCall.callCount).to.equals(1);
        expect(stubUpsertCall.calledWith(req.body.id, req.body)).to.equals(true);
        expect(stubGetCorbelErrorBody.callCount).to.equals(1);
        expect(stubGetCorbelErrorBody.calledWith(error)).to.equals(true);

        done();
      }});

     });

  it('Phrase.delete throws an error in deleteCall', function(done) {
      var error = {
        status: 408,
        message: 'testError'
      }
      var stubDeleteCall = sandbox.stub(Phrase, 'deleteCall').returns(Promise.reject(error));
     
      Phrase.delete(req, {send: function(status){

        expect(status).to.be.equal(408);
        expect(stubGetAuthorization.callCount).to.equals(1);
        expect(stubGetAuthorization.calledWith(req)).to.equals(true);
        expect(stubGetDriver.callCount).to.equals(1);
        expect(stubGetDriver.calledWith(auth)).to.equals(true);
        expect(stubGetDomain.callCount).to.equals(1);
        expect(stubGetDomain.calledWith(auth)).to.equals(true);
        expect(stubDeleteCall.callCount).to.equals(1);
        expect(stubDeleteCall.calledWith(driver, fullId)).to.equals(true);

        done();
      }});
  });

  it('Phrase.get throws an error in getCall if the phrase does not exists', function(done) {
      var stubGetCall = sandbox.stub(Phrase, 'getCall').returns(undefined);

      Phrase.get(req, {send: function(status){

        expect(status).to.be.equal(404);
        expect(stubGetAuthorization.callCount).to.equals(1);
        expect(stubGetAuthorization.calledWith(req)).to.equals(true);
        expect(stubGetDomain.callCount).to.equals(1);
        expect(stubGetDomain.calledWith(auth)).to.equals(true);
        expect(stubGetCall.callCount).to.equals(1);
        expect(stubGetCall.calledWith(domain, fullId)).to.equals(true);

        done();
      }});
  });

  it('Phrase.get throws an error if there are not authorization and domain', function(done) {
      stubGetDomain.restore();
      stubGetDomain = sandbox.stub(Phrase, 'getDomain', function(){
          return undefined;
      });
      stubGetAuthorization.restore();
      stubGetAuthorization = sandbox.stub(Phrase, 'getAuthorization', function(){
          return undefined;
      });

      Phrase.get(req, {send: function(status){

        expect(status).to.be.equal(401);
        expect(stubGetAuthorization.callCount).to.equals(1);
        expect(stubGetAuthorization.calledWith(req)).to.equals(true);
        expect(stubGetDomain.callCount).to.equals(1);
        expect(stubGetDomain.calledWith(undefined)).to.equals(true);

        done();
      }});
  });

  it('Phrase.getAll throws an error if there is no domain', function(done) {
      stubGetDomain.restore();
      stubGetDomain = sandbox.stub(Phrase, 'getDomain', function(){
          return undefined;
      });
      
      Phrase.getAll(req, {send: function(status){

        expect(status).to.be.equal(401);
        expect(stubGetAuthorization.callCount).to.equals(1);
        expect(stubGetAuthorization.calledWith(req)).to.equals(true);
        expect(stubGetDomain.callCount).to.equals(1);
        expect(stubGetDomain.calledWith(auth)).to.equals(true);

        done();
      }});
  });
});
