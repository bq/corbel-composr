'use strict';

var phraseManager = require('../../../src/lib/phraseManager.js'),
  phrasesData = require('../../../src/lib/phrasesData.js'),
  _ = require('lodash'),
  chai = require('chai'),
  expect = chai.expect,
  assert = chai.assert,
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
    expect(phraseManager).to.respondTo('getById');
    expect(phraseManager).to.respondTo('getByPhraseName');
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
        var phraseIndex = phraseManager.getById('domain', 'domain!test' + i);
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

      var phraseIndex = phraseManager.getById('domain', 'domain!delete');

      expect(phraseIndex).to.be.equal(-1);

      phraseIndex = phraseManager.getById('domain', 'domain!nodelete');
      expect(phrasesData.list['domain'][phraseIndex]).to.exist;
      expect(phrasesData.list['domain'][phraseIndex].get).to.exist;
      expect(phrasesData.list['domain'][phraseIndex].post).to.exist;
      expect(phrasesData.list['domain'][phraseIndex].put).to.exist;
      expect(phrasesData.list['domain'][phraseIndex].delete).to.exist;

    });

  });
});
