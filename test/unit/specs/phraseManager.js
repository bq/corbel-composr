'use strict';

var phraseManager = require('../../../src/lib/phraseManager.js'),
  phrasesData = require('../../../src/lib/phrasesData.js'),
  _ = require('lodash'),
  chai = require('chai'),
  expect = chai.expect,
  assert = chai.assert,
  sinon = require('sinon'),
  express = require('express');

var getPhrase = function(id) {
  var code = 'res.render(\'index\', {title: \'test\'});';
  return {
    id: id,
    get: {
      code: code
    },
    post: {
      code: code
    },
    put: {
      code: code
    },
    delete: {
      code: code
    }
  };
};

describe('in phraseManager module', function() {

  it('is defined and is an object', function() {
    expect(phraseManager).to.be.an('object');
  });

  it('expected methods are available', function() {
    expect(phraseManager).to.respondTo('run');
    expect(phraseManager).to.respondTo('getPhraseIndexById');
    expect(phraseManager).to.respondTo('getPhraseByName');
    expect(phraseManager).to.respondTo('registerPhrase');
    expect(phraseManager).to.respondTo('unregisterPhrase');
  });

  describe('when registering a phrase', function() {

    it('phrase is required', function() {
      expect(function() {
        phraseManager.registerPhrase();
      }).to.throw('undefined:phrase');
    });

    it('it registers the expected phrases', function() {

      for (var i = 0; i < 2; i++) {
        phraseManager.registerPhrase(getPhrase('domain!test' + i));
      }

      expect(phrasesData.list['domain']).to.exist;
      for (var i = 0; i < 2; i++) {
        var phraseIndex = phraseManager.getPhraseIndexById('domain', 'domain!test' + i);
        expect(phrasesData.list['domain'][phraseIndex]).to.exist;
        expect(phrasesData.list['domain'][phraseIndex].get).to.exist;
        expect(phrasesData.list['domain'][phraseIndex].post).to.exist;
        expect(phrasesData.list['domain'][phraseIndex].put).to.exist;
        expect(phrasesData.list['domain'][phraseIndex].delete).to.exist;
      }

    });
  });

  describe('when unregistering a phrase', function() {

    it('phrase object is required', function() {
      expect(function() {
        phraseManager.unregisterPhrase();
      }).to.throw('undefined:phrase');
    });

    it('phrase.id is required', function() {
      expect(function() {
        phraseManager.unregisterPhrase({}, {});
      }).to.throw('undefined:phrase:id');
    });

    it('it deletes the expected phrases', function() {

      phraseManager.registerPhrase(getPhrase('domain!delete'));
      phraseManager.registerPhrase(getPhrase('domain!nodelete'));

      phraseManager.unregisterPhrase({
        id: 'domain!delete'
      });

      for (var i = 0; i < 2; i++) {
        phraseManager.registerPhrase(getPhrase('domain!test' + i));
      }

      expect(phrasesData.list['domain']).to.exist;

      var phraseIndex = phraseManager.getPhraseIndexById('domain', 'domain!delete');

      expect(phraseIndex).to.be.equal(-1);

      phraseIndex = phraseManager.getPhraseIndexById('domain', 'domain!nodelete');
      expect(phrasesData.list['domain'][phraseIndex]).to.exist;
      expect(phrasesData.list['domain'][phraseIndex].get).to.exist;
      expect(phrasesData.list['domain'][phraseIndex].post).to.exist;
      expect(phrasesData.list['domain'][phraseIndex].put).to.exist;
      expect(phrasesData.list['domain'][phraseIndex].delete).to.exist;

    });

  });

  describe('Get the correct phrase index by id', function(){
    var domain = 'test';
    var stub;
    var phrases = [
      {
        id : 'test'
      },{
        id : 'two'
      }
    ];

    before(function(){
      stub = sinon.stub(phraseManager, 'getPhrases', function(){
        return phrases;
      })
    });

    after(function(){
      stub.restore();
    });

    it('gets phrases with the correct id', function() {
      var index = phraseManager.getPhraseIndexById('test', 'two');
      expect(index).to.equals(1);

      index = phraseManager.getPhraseIndexById('test', 'test');
      expect(index).to.equals(0);
    });

    it('does not find an undefined phrase', function(){
      var index = phraseManager.getPhraseIndexById('test', 'asdasdasdasd');
      expect(index).to.equals(-1);
    });
  });

  describe('Get the correct phrase based on the number of arguments', function(){
    var phrases = [
      {
        url : ''
      },{
        url : ':param'
      },{
        url : 'test/:arg/:arg2'
      },{
        url : 'test/:arg/:optional?'
      },{
        url : 'user/:arg/:optional?/name'
      }
    ];

    it('Gets the correct phrases for 0 arguments', function() {
      var phrasesAllowed = phraseManager.getPhrasesWithAllowedNumberOfArguments(phrases, []);
      expect(phrasesAllowed.length).to.equals(1);
      expect(phrasesAllowed[0].url).to.equals('');
    });

    it('Gets the correct phrases for 1 argument', function() {
      var phrasesAllowed = phraseManager.getPhrasesWithAllowedNumberOfArguments(phrases, ['arg1']);
      expect(phrasesAllowed.length).to.equals(1);
      expect(phrasesAllowed[0].url).to.equals(':param');
    });

    it('Gets the correct phrases for 2 arguments', function() {
      var phrasesAllowed = phraseManager.getPhrasesWithAllowedNumberOfArguments(phrases, ['arg1', 'arg2']);
      expect(phrasesAllowed.length).to.equals(1);
      expect(phrasesAllowed[0].url).to.equals('test/:arg/:optional?');
    });
    
    it('Gets the correct phrases for 3 arguments', function(){
      var phrasesAllowed = phraseManager.getPhrasesWithAllowedNumberOfArguments(phrases, ['arg1', 'arg2', 'arg3']);
      expect(phrasesAllowed.length).to.equals(3);
      expect(phrasesAllowed[0].url).to.equals('test/:arg/:arg2');
      expect(phrasesAllowed[1].url).to.equals('test/:arg/:optional?');
      expect(phrasesAllowed[2].url).to.equals('user/:arg/:optional?/name');
    });

    it('Gets the correct phrases for 4 arguments', function(){
      var phrasesAllowed = phraseManager.getPhrasesWithAllowedNumberOfArguments(phrases, ['arg1', 'arg2', 'arg3', 'arg4']);
      expect(phrasesAllowed.length).to.equals(1);
      expect(phrasesAllowed[0].url).to.equals('user/:arg/:optional?/name');
    });
  });

  describe('Get the correct phrase index by name', function(){
    var domain = 'test';
    var stub;
    var phrases = [
      {
        url : ''
      },{
        url : ':param'
      },{
        url : 'pepito'
      },{
        url : 'test/:arg/:arg2'
      },{
        url : 'test/:arg/:optional?'
      },{
        url : 'user/:arg/:optional?/name'
      }
    ];

    before(function(){
      stub = sinon.stub(phraseManager, 'getPhrases', function(){
        return phrases;
      })
    });

    after(function(){
      stub.restore();
    });

    it('gets phrases with root url : /', function() {
      var phrase = phraseManager.getPhraseByName('test', '');
      expect(phrase.url).to.equals('');
    });

    it('gets phrases with url parameters: /:param', function(){
      var phrase = phraseManager.getPhraseByName('test', 'francisco');
      expect(phrase.url).to.equals(':param');
    });

    it('gets the first phrase that matches with url parameters: /pepito', function(){
      var phrase = phraseManager.getPhraseByName('test', 'pepito');
      expect(phrase.url).to.equals(':param');
    });

    it('gets phrases with query params: /url?param=test', function(){
      var phrase = phraseManager.getPhraseByName('test', 'url?param=test');
      expect(phrase.url).to.equals(':param');
    });

    it('gets phrases with optional parameters at the end: test/:arg/:optional?', function(){
      var phrase = phraseManager.getPhraseByName('test', 'test/hola');
      expect(phrase.url).to.equals('test/:arg/:optional?');
    });

    it('gets the first phrase if 2 phrases collide with number of arguments and importancy', function(){
      var phrase = phraseManager.getPhraseByName('test', 'test/hola/adios');
      expect(phrase.url).to.equals('test/:arg/:arg2');
    });

  });

});
