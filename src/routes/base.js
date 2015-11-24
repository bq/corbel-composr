'use strict';

/*var express = require('express'),
  router = express.Router(),
  config = require('../lib/config'),
  engine = require('../lib/engine'),
  q = require('q'),
  https = require('https'),
  packageJSON = require('../../package.json');

router.get('/', function(req, res) {
  res.render('index', {
    title: 'Composing your phrases',
    version: packageJSON.version
  });
});

router.get('/version', function(req, res) {
  res.send(packageJSON);
});

function status(req, res) {

  var phrasesLoaded = engine.composr.Phrases.count();

  var statuses = {
    'phrases': phrasesLoaded > 0 ? true : false,
    'phrasesLoaded' : phrasesLoaded,
    'worker' : engine.getWorkerStatus()
  };

  var modules = ['iam', 'resources'];
  var path = config('corbel.driver.options').urlBase;
  var promises = modules.map(function(module) {
    var deferred = q.defer();

    https.get(path.replace('{{module}}', module) + '/version', function() {
      statuses[module] = true;
      deferred.resolve();
    })
      .on('error', function() {
        statuses[module] = false;

        deferred.resolve();
      });

    return deferred.promise;
  });

  q.all(promises)
    .then(function() {
      if (req.accepts('html')) {
        res.render('status', {
          statuses: statuses,
          version: packageJSON.version,
          title: 'CompoSR Status',
          appName: 'CompoSR'
        });

      } else {
        res.send({
          version: packageJSON.version,
          statuses: statuses
        });
      }
    });

}

router.get('/status', status);
router.get('/healthcheck', status);

module.exports = router;*/


var config = require('../lib/config'),
  engine = require('../lib/engine'),
  q = require('q'),
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
          resolve();
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
