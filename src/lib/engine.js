'use strict';

var logger = require('../utils/logger'),
  composr = require('composr-core'),
  q = require('q'),
  https = require('https'),
  config = require('./config');

var initialized, 
  workerStatus,
  initComposrCore,
  suscribeLogger,
  resolveOrRejectServiceCheckingRequest,
  initServiceCheckingRequests,
  waitTilServicesUp,
  getComposrCoreCredentials,
  launchTries,
  init,
  setWorkerStatus,
  getWorkerStatus,
  suscribeLogger,
  phrasesCollection,
  snippetsCollection,
  composr;

function initLocalFunctionsAliases() {
  initComposrCore = module.exports.initComposrCore;
  suscribeLogger = module.exports.suscribeLogger;
  resolveOrRejectServiceCheckingRequest = module.exports.resolveOrRejectServiceCheckingRequest;
  initServiceCheckingRequests = module.exports.initServiceCheckingRequests;
  waitTilServicesUp = module.exports.waitTilServicesUp;
  getComposrCoreCredentials = module.exports.getComposrCoreCredentials;
  launchTries = module.exports.launchTries;
  init = module.exports.init;
  setWorkerStatus = module.exports.setWorkerStatus;
  getWorkerStatus = module.exports.getWorkerStatus;
  initialized = module.exports.initialized = false;
  workerStatus = module.exports.workerStatus = false;
  phrasesCollection = module.exports.phrasesCollection = 'composr:Phrase';
  snippetsCollection = module.exports.snippetsCollection = 'composr:Snippet';
  module.exports.composr = composr;
}

module.exports.suscribeLogger = function() {
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
};

/************************************************************
 * - Deletes timeout handler
 * - Resolves service checking request if response from server
 * - Rejects service checking request if 'error' evt or timeout while waiting for response
 * @param  {Function} resolve Services to check
 * @param  {Function} reject Timeout before reject promise
 * @param  {String} module service currently checking
 * @param  {Object} promiseTimeoutHandler Timeout handler
 * @return nothing
 *************************************************************/

module.exports.resolveOrRejectServiceCheckingRequest = function(resolve, reject, request, module, promiseTimeoutHandler) {
  if (promiseTimeoutHandler) {
    clearTimeout(promiseTimeoutHandler);
  }
  if (resolve) {
    logger.info('External service', module, 'is UP');
    resolve();
  } else if (reject) {
    logger.error('External service', module, 'is DOWN');
    request.abort();
    reject();
  }
};

/************************************************************
 * - Launches services checking requests
 * @param  {Array} modules Services to check
 * @param  {integer} serviceCheckingRequestTimeout Timeout before reject promise
 * @return {Array} promises
 *************************************************************/

module.exports.initServiceCheckingRequests = function(modules, serviceCheckingRequestTimeout) {
  var path = config('corbel.driver.options').urlBase;
  var promises = modules.map(function(module) {
    var url;
    logger.info('Checking for external service', module);
    return new Promise(function(resolve, reject) {
      var promiseTimeoutHandler;
      url = path.replace('{{module}}', module) + 'version';
      var request = https.get(url, function() {
          // resolveOrRejectServiceCheckingRequest === undefined -> Promises rejected 
          if (resolveOrRejectServiceCheckingRequest) {
            resolveOrRejectServiceCheckingRequest(resolve, null, request, module, promiseTimeoutHandler);
          }
        })
        .on('error', function() {
          // When a request is aborted and error is raised, so we must check that Promise who owns the request is in pending state 
          if (resolveOrRejectServiceCheckingRequest) {
            resolveOrRejectServiceCheckingRequest(null, reject, request, module, promiseTimeoutHandler);
          }
        });
      promiseTimeoutHandler = setTimeout(resolveOrRejectServiceCheckingRequest, serviceCheckingRequestTimeout, null, reject, request, module, promiseTimeoutHandler);
    });
  });
  return promises;
};

//Recursivelly wait until all the corbel services are up
module.exports.waitTilServicesUp = function() {
  var modules = ['iam', 'resources'];
  var serviceCheckingRequestTimeout = config('services.timeout');
  var promises = initServiceCheckingRequests(modules, serviceCheckingRequestTimeout);
  return Promise.all(promises);
};

//Returns the credentials for the composr-core initialization
module.exports.getComposrCoreCredentials = function() {
  return {
    credentials: {
      clientId: config('corbel.composr.credentials').clientId,
      clientSecret: config('corbel.composr.credentials').clientSecret,
      scopes: config('corbel.composr.credentials').scopes,
    },
    urlBase: config('corbel.driver.options').urlBase
  };
};

//Inits the composr-core package
module.exports.initComposrCore = function(credentials, fetchData) {
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
        reject(err);
      });
  });
};

module.exports.launchTries = function() {
  var retries = config('services.retries');
  var time = config('services.time');
  // var dfd = q.defer();

  return new Promise(function(resolve, reject) {
    function launch(retries) {
      if (!retries) {
        return reject();
      }
      waitTilServicesUp()
        .then(function() {
          logger.info('All Services up and running!');
          resolve();
        })
        .catch(function() {
          logger.info('Retrying services check after', time * retries, 'milliseconds');
          setTimeout(function() {
            return launch(retries - 1);
          }, time * retries);
        });
    }
    launch(retries);
  });
};

/**
 * Launches the bootstrap of data, worker and logger
 * @param  {[type]} app [description]
 * @return promise
 */
module.exports.init = function(app) {
  initLocalFunctionsAliases();
  var dfd = q.defer();
  var retries = config('services.retries');
  var fetchData = true;
  
  //Suscribe to log events
  suscribeLogger();

  launchTries(retries)
    .then(function() {
      initComposrCore(getComposrCoreCredentials(), fetchData)
        .then(function() {
          dfd.resolve({
            app: app,
            composr: composr,
            initialized: initialized
          });
        })
        .catch(dfd.reject);
    })
    .catch(function() {
      initComposrCore(getComposrCoreCredentials(), !fetchData)
        .then(function() {
          logger.info('The server is launched, delaying the fetch data');
        })
        .then(function() {
          tryAgain();
        });
    });

  function tryAgain() {
    launchTries(retries)
      .then(function() {
        logger.info('Data is available, fetching');
        initComposrCore(getComposrCoreCredentials(), fetchData); 
      })
      .catch(function() {
        //If the services were unavailable delay the retries and go on
        logger.error('Services where unaccesible after ' + retries + ' retries');
        tryAgain();
      });
  }
  return dfd.promise;
};

module.exports.setWorkerStatus = function(bool) {
  workerStatus = bool;
};


module.exports.getWorkerStatus = function() {
  return workerStatus;
};