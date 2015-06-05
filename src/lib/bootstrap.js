'use strict';

var express = require('express'),
  router = express.Router(),
  phraseManager = require('./phraseManager'),
  ComposerError = require('./composerError'),
  connection = require('./corbelConnection'),
  q = require('q'),
  config = require('./config'),
  logger = require('../utils/logger');

var PAGE_SIZE = 10;

var getPhrase = function(driver, phrasesCollection, phrases, promise, pageNumber) {
  phrases = phrases || [];
  pageNumber = pageNumber || 0;
  promise = promise || q.resolve();

  return promise.then(function() {

    var params = {
      pagination: {
        page: pageNumber
      }
    };

    return driver.resources.collection(phrasesCollection).get(params, 'application/json').
    then(function(response) {
      if(response.data && response.status === 200){
        phrases = phrases.concat(response.data);
        if (response.data.length < PAGE_SIZE) {
          return phrases;
        } else {
          return getPhrase(driver, phrasesCollection, phrases, promise, pageNumber + 1);
        }
      }else{
        throw new ComposerError('error:composer:corbel:phrases', '', 500);
      }
    });
  });
};


var bootstrapPhrases = function() {
  var dfd = q.defer();

  process.env.PHRASES_COLLECTION = 'composr:Phrase';

  connection.driver.then(function(driver) {
    getPhrase(driver, connection.PHRASES_COLLECTION).then(function(phrases) {

      phrases.forEach(function(phrase) {
        logger.debug('Phrase loaded', phrase.id);
        phraseManager.registerPhrase(router, phrase);
      });

      dfd.resolve();
    }).
    fail(function(error) {
      logger.error('error:bootstrap:load', error);
      setTimeout(bootstrapPhrases, config('bootstrap.retrytimeout'));
    });

  }).catch(function(error) {
    logger.error('error:bootstrap:driver', error);
    dfd.reject(error);
  });

  return dfd.promise;
};

function bootstrapSnippets(){
  //TODO: obtain snippets
  var dfd = q.defer();
  dfd.resolve();
  return dfd.promise;
}

function getSnippets(){
  return {
    'silkroad-qa' : [
      {
        name : 'log',
        code : 'console.log("ey");'
      },
      {
        name : 'example',
        code : 'this.log();'
      },
      {
        name : 'sendJson',
        code : 'compoSR.run("json", params)'
      },
      {
        name : 'json',
        code: 'params.res.send({ hello2 : params.message})'
      }
    ]
  };
}

module.exports = {
  router: router,
  phrases : bootstrapPhrases,
  snippets : bootstrapSnippets,
  getSnippets : getSnippets
};
