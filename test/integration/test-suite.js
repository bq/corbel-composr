'use strict';

// Integration
var tests = [
  require('./specs/timeout.test.js'),
  require('./specs/errorHandlers.test.js'),
  require('./specs/pathParams.test.js'),
  require('./specs/publishPhrase.test.js'),
  //require('./specs/unpublishPhrase.test.js'),
  require('./specs/publishSnippet.test.js'),
  //require('./specs/unpublishSnippet.test.js'),
  require('./specs/cache.test.js'),
  require('./specs/getToPhraseEndpoint.js')
];

module.exports = function(serverPromise) {
  var server;

  describe('setup', function() {
    this.timeout(30000);
    before(function(done) {
      //Wait for app initialization
      serverPromise.then(function(res) {
        server = res;
        done();
      });
    });

    //This wrapping is needed because otherwise application would be an empty object
    it('Executes the integration tests', function() {
      tests.forEach(function(test) {
        test(server);
      });
    });

  });

};
