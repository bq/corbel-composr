'use strict';

// Integration
var timeoutTests = require('./specs/timeout.js'),
    errorHandlerTests = require('./specs/errorHandlers.js'),
    exampleTests = require('./specs/example.js'),
    cacheTests = require('./specs/cache.js'),
    loginTests = require('./specs/login.js'),
    brokenPhraseTests = require('./specs/brokenPhrase.js'),
    phraseTests = require('./specs/phrase.js');

module.exports = function(app){
  cacheTests(app);
  timeoutTests(app);
  errorHandlerTests(app);
  exampleTests(app);
  brokenPhraseTests(app);
  phraseTests(app);
  loginTests(app);
};
