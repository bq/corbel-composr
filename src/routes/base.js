'use strict';

var config = require('../lib/config'),
  engine = require('../lib/engine'),
  https = require('https'),
  packageJSON = require('../../package.json');

function status(req, res) {

  var phrasesLoaded = engine.composr.Phrases.count();

  var statuses = {
    'phrases': phrasesLoaded > 0 ? true : false,
    'phrasesLoaded': phrasesLoaded,
    'worker': engine.getWorkerStatus()
  };

  var modules = ['iam', 'resources'];
  var path = config('corbel.driver.options').urlBase;

  var promises = modules.map(function(module) {
    return new Promise(function(resolve, reject) {
      https.get(path.replace('{{module}}', module) + '/version', function() {
        statuses[module] = true;
        resolve();
      })
        .on('error', function() {
          statuses[module] = false;
          reject();
        });
    });
  });

  Promise.all(promises)
    .then(function() {
      res.send({
        version: packageJSON.version,
        statuses: statuses
      });
    });
}

module.exports = function(server) {

  server.get('/', function(req, res) {
    res.send({
      title: 'Composing your phrases',
      version: packageJSON.version
    });
  });

  server.get('/version', function(req, res) {
    res.send(packageJSON);
  });

  server.get('/status', status);

  server.get('/healthcheck', status);
};
