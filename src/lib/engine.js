'use strict';

var logger = require('../utils/logger'),
  composr = require('composr-core'),
  q = require('q'),
  https = require('https'),
  config = require('./config');

var phrasesCollection = 'composr:Phrase';
var snippetsCollection = 'composr:Snippet';
var initialized = false;

function suscribeLogger() {
  composr.events.on('debug', 'CorbelComposr', function() {
    //TODO change to log all, but change core to send less info
    //logger.debug(Array.prototype.slice.call(arguments)[0]);
    logger.debug.apply(logger, arguments);
  });

  composr.events.on('error', 'CorbelComposr', function() {
    logger.error.apply(logger, arguments);
  });

  composr.events.on('warn', 'CorbelComposr', function() {
    logger.warn.apply(logger, arguments);
  });

  composr.events.on('info', 'CorbelComposr', function() {
    logger.info.apply(logger, arguments);
  });
}



function waitTilServicesUp(cb, time, retries) {
  var modules = ['iam', 'resources'];
  var path = config('corbel.driver.options').urlBase;

  if (retries <= 0) {
    cb(true);
  } else {
    var promises = modules.map(function(module) {
      logger.info('Checking for external service', module);
      var deferred = q.defer();

      https.get(path.replace('{{module}}', module) + '/version', function() {
        deferred.resolve();
        logger.info('External service', module, 'is UP');
      })
        .on('error', function() {
          logger.error('External service', module, 'is DOWN');
          deferred.reject();
        });

      return deferred.promise;
    });

    q.all(promises)
      .then(function() {
        logger.info('All Services up and running!');
        cb();
      })
      .catch(function() {
        logger.info('Retrying services check after', time * retries, 'milliseconds');
        setTimeout(function() {
          waitTilServicesUp(cb, time, retries - 1);
        }, time * retries);
      });
  }

}


/**
 * Launches the bootstrap of data, worker and logger
 * @param  {[type]} app [description]
 * @return promise
 */
function init(app) {
  var dfd = q.defer();

  suscribeLogger();

  var coreOptions = {
    credentials: {
      clientId: config('corbel.composer.credentials').clientId,
      clientSecret: config('corbel.composer.credentials').clientSecret,
      scopes: config('corbel.composer.credentials').scopes,
    },
    urlBase: config('corbel.driver.options').urlBase
  };
  var retries = 30;

  waitTilServicesUp(function(err) {

    if (err) {
      logger.error('Services where unaccesible after ' + retries + ' retries');
      dfd.reject('error:accessing:services');
    } else {
      composr.init(coreOptions)
        .then(function() {
          initialized = true;
          logger.info('Engine initialized, all data is loaded :)');
          dfd.resolve({
            app: app,
            composr: composr,
            initialized: initialized
          });
        })
        .catch(function(err) {
          initialized = false;
          logger.error('ERROR launching composr, please check your credentials and network');
          logger.error(err);
          dfd.reject(err);
          //TODO: notify healthcheck services
        });
    }

  }, 1000, retries);

  return dfd.promise;
}


module.exports = {
  init: init,
  composr: composr,
  initialized: initialized,
  phrasesCollection: phrasesCollection,
  snippetsCollection: snippetsCollection
};