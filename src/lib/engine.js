'use strict';

var logger = require('../utils/logger'),
  composr = require('composr-core'),
  q = require('q'),
  https = require('https'),
  config = require('./config');

var phrasesCollection = 'composr:Phrase';
var snippetsCollection = 'composr:Snippet';
var initialized = false;
var workerStatus = false;

function suscribeLogger() {
  composr.events.on('debug', 'CorbelComposr', function() {
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


//Recursivelly wait until all the corbel services are up
function waitTilServicesUp(cb, retries) {
  var modules = ['iam', 'resources'];
  var path = config('corbel.driver.options').urlBase;
  var time = 1000;

  if (retries <= 0) {
    cb(true);
  } else {
    var promises = modules.map(function(module) {
      logger.info('Checking for external service', module);

      return new Promise(function(resolve, reject) {
        https.get(path.replace('{{module}}', module) + '/version', function() {
          resolve();
          logger.info('External service', module, 'is UP');
        })
          .on('error', function() {
            logger.error('External service', module, 'is DOWN');
            reject();
          });
      });

    });

    Promise.all(promises)
      .then(function() {
        logger.info('All Services up and running!');
        cb();
      })
      .catch(function() {
        logger.info('Retrying services check after', time * retries, 'milliseconds');
        setTimeout(function() {
          waitTilServicesUp(cb, retries - 1);
        }, time * retries);
      });
  }

}

//Returns the credentials for the composr-core initialization
function getComposrCoreCredentials() {
  return {
    credentials: {
      clientId: config('corbel.composr.credentials').clientId,
      clientSecret: config('corbel.composr.credentials').clientSecret,
      scopes: config('corbel.composr.credentials').scopes,
    },
    urlBase: config('corbel.driver.options').urlBase
  };
}

//Inits the composr-core package
function initComposrCore(credentials, fetchData) {
  return new Promise(function(resolve, reject) {
    composr.init(credentials, fetchData)
      .then(function() {
        initialized = true;
        var msg = fetchData ? 'Engine initialized with data! :)' : 'Engine initialized without data';
        logger.info(msg);
        resolve();
      })
      .catch(function(err) {
        initialized = false;
        logger.error('ERROR launching composr, please check your credentials and network');
        logger.error(err);
        reject(err);
      });
  });

}

function launchTemporalRetry() {
  logger.info('The server is launched, delaying the fetch data');
  var retries = 30;
  waitTilServicesUp(function(err) {
    if (err) {
      launchTemporalRetry();
    } else {
      logger.info('Data is available, fetching');
      initComposrCore(getComposrCoreCredentials(), true);
    }
  }, retries);
}

/**
 * Launches the bootstrap of data, worker and logger
 * @param  {[type]} app [description]
 * @return promise
 */
function init(app) {
  var dfd = q.defer();

  var credentials = getComposrCoreCredentials();
  var retries = 15;
  //Suscribe to log events
  suscribeLogger();

  //Wait until services are up, and init the core
  waitTilServicesUp(function(err) {
    var fetchData;

    if (err) {
      //If the services were unavailable delay the retries and go on
      logger.error('Services where unaccesible after ' + retries + ' retries');
      launchTemporalRetry();
      fetchData = false;
    } else {
      fetchData = true;
    }

    initComposrCore(credentials, fetchData)
      .then(function() {
        dfd.resolve({
          app: app,
          composr: composr,
          initialized: initialized
        });
      })
      .catch(dfd.reject);

  }, retries);

  return dfd.promise;
}

function setWorkerStatus(bool){
  workerStatus = bool;
}

function getWorkerStatus(){
  return workerStatus;
}

module.exports = {
  init: init,
  composr: composr,
  initialized: initialized,
  phrasesCollection: phrasesCollection,
  snippetsCollection: snippetsCollection,
  setWorkerStatus : setWorkerStatus,
  getWorkerStatus : getWorkerStatus
};