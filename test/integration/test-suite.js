'use strict';

// Integration
var cacheTests = require('./specs/cache.js'),
  codehash = require('./specs/codehash.js'),
  pathParamsTests = require('./specs/pathParams.js'),
  queryParams = require('./specs/queryParams.js');

module.exports = function(promise) {
  var application;

  describe('setup', function() {
    this.timeout(30000);
    before(function(done) {
      //Wait for app initialization
      promise.then(function(app) {
        application = app;
        done();
      });
    });

    //This wrapping is needed because otherwise application would be an empty object
    it('Executes the integration tests', function() {
      pathParamsTests(application);
      queryParams(application);
      codehash(application);
      cacheTests(application);
    });

  });

};