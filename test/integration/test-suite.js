'use strict';

// Integration
var timeoutTests = require('./specs/timeout.js'),
    errorHandlerTests = require('./specs/errorHandlers.js'),
    exampleTests = require('./specs/example.js'),
    cacheTests = require('./specs/cache.js'),
    loginTests = require('./specs/login.js'),
    brokenPhraseTests = require('./specs/brokenPhrase.js'),
    codebase64 = require('./specs/codebase64.js'),
    pathParamsTests = require('./specs/pathParams.js'),
    queryParams = require('./specs/queryParams.js'),
    composerErrorPhrase = require('./specs/composerErrorPhrase.js'),
    phraseTests = require('./specs/phrase.js');

module.exports = function(promise){
  var application;

  describe('setup', function(){
    this.timeout(30000);
    before(function(done){
      //Wait for app initialization
      promise.then(function(app){
        application = app;
        done();
      });
    });

    //This wrapping is needed because otherwise application would be an empty object
    it('Executes the integration tests', function(){
      pathParamsTests(application);
      queryParams(application);
      codebase64(application);
      cacheTests(application);
      timeoutTests(application);
      errorHandlerTests(application);
      exampleTests(application);
      brokenPhraseTests(application);
      composerErrorPhrase(application);
      phraseTests(application);
      loginTests(application);
    });

  });

};
