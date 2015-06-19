'use strict';

var express = require('express'),
  router = express.Router(),
  config = require('../lib/config'),
  phraseManager = require('../lib/phraseManager'),
  q = require('q'),
  https = require('https'),
  packageJSON = require('../../package.json');

router.get('/', function(req, res) {
  res.render('index', {
    title: 'corbel-composr',
    version: packageJSON.version
  });
});

router.get('/version', function(req, res) {
  res.send(packageJSON);
});

router.get('/status', function(req, res) {
  var phrasesLoaded = phraseManager.getAmountOfPhrasesLoaded();

  var statuses = [{
    title: 'Phrases Loaded',
    ok: phrasesLoaded > 0 ? true : false
  }];


  var modules = ['iam', 'resources'];
  var path = config('corbel.driver.options').urlBase;
  var promises = modules.map(function(module) {
    var deferred = q.defer();

    https.get(path.replace('{{module}}', module) + '/version', function(err, resp) {
      statuses.push({
        title: module,
        ok: true
      });
      deferred.resolve();
    })
      .on('error', function(e) {
        statuses.push({
          title: module,
          ok: false
        });

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

});

module.exports = router;