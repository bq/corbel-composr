'use strict';

var express = require('express'),
  router = express.Router(),
  phraseManager = require('./phraseManager'),
  connection = require('./corbelConnection'),
  q = require('q'),
  config = require('../config/config.json');

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
      phrases = phrases.concat(response.data);
      if (response.data.length < PAGE_SIZE) {
        return phrases;
      } else {
        return getPhrase(driver, phrasesCollection, phrases, promise, pageNumber + 1);
      }
    });
  });
};


var bootstrap = function() {
  process.env.PHRASES_COLLECTION = 'composr:Phrase';

  connection.driver.then(function(driver) {
    getPhrase(driver, connection.PHRASES_COLLECTION).then(function(phrases) {
      return phrases.forEach(function(phrase) {
        console.log(phrase);
        phraseManager.registerPhrase(router, phrase);
      });
    }).
    fail(function(error) {
      console.error('Bootstrap error', error);
      setTimeout(bootstrap, config['bootstrap.retrytimeout']);
    });

  }).catch(function(error) {
    console.error('Bootstrap get driver error', error);
  });
};

bootstrap();

module.exports = router;
