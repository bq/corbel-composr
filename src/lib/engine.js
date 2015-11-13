'use strict';

var logger = require('../utils/logger'),
  composr = require('composr-core'),
  q = require('q'),
  https = require('https'),
  config = require('./config');

var initialized = module.exports.initialized = false;
var workerStatus = module.exports.workerStatus = false;
var shouldAbort = module.exports.workerStatus = false;
var initComposrCore;
var suscribeLogger;
var resolveOrRejectServiceCheckingRequest;
var initServiceCheckingRequests;
var waitTilServicesUp;
var getComposrCoreCredentials;
var launchTemporalRetry;
var init;
var setWorkerStatus;
var getWorkerStatus;
var suscribeLogger;
var abort;

function initLocalFunctionsAliases() {
  initComposrCore = module.exports.initComposrCore;
  suscribeLogger = module.exports.suscribeLogger;
  resolveOrRejectServiceCheckingRequest = module.exports.resolveOrRejectServiceCheckingRequest;
  initServiceCheckingRequests = module.exports.initServiceCheckingRequests;
  waitTilServicesUp = module.exports.waitTilServicesUp;
  getComposrCoreCredentials = module.exports.getComposrCoreCredentials;
  launchTemporalRetry = module.exports.launchTemporalRetry;
  init = module.exports.init;
  setWorkerStatus = module.exports.setWorkerStatus;
  getWorkerStatus = module.exports.getWorkerStatus;
  abort = module.exports.abort;
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
          resolveOrRejectServiceCheckingRequest(resolve, null, request, module, promiseTimeoutHandler);
        })
        .on('error', function() {
          // When a request is aborted and error is raised, so we must check that Promise who owns the request is in pending state 
          if (this.status === 0) {
            resolveOrRejectServiceCheckingRequest(null, reject, request, module, promiseTimeoutHandler);
          }
        });
      promiseTimeoutHandler = setTimeout(resolveOrRejectServiceCheckingRequest, serviceCheckingRequestTimeout, null, reject, request, module, promiseTimeoutHandler);
    });
  });
  return promises;
};

//Recursivelly wait until all the corbel services are up
module.exports.waitTilServicesUp = function(cb, retries) {
  var modules = ['iam', 'resources'];
  var time = config('services.time');
  var serviceCheckingRequestTimeout = config('services.timeout');

  if (retries <= 0) {
    cb(true);
  } else {
    var promises = initServiceCheckingRequests(modules, serviceCheckingRequestTimeout);
    Promise.all(promises)
      .then(function() {
        logger.info('All Services up and running!');
        cb();
      })
      .catch(function() {
        if (shouldAbort) {
          return cb(false); 
        }
        logger.info('Retrying services check after', time * retries, 'milliseconds');
        setTimeout(function() {
          waitTilServicesUp(cb, retries - 1);
        }, time * retries);
      });
  }
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

module.exports.launchTemporalRetry = function() {
  logger.info('The server is launched, delaying the fetch data');
  var retries = config('services.retries');
  waitTilServicesUp(function(err) {
    if (err) { 
      launchTemporalRetry();
    } else {
      logger.info('Data is available, fetching');
      initComposrCore(getComposrCoreCredentials(), true);
    }
  }, retries);
};

/**
 * Launches the bootstrap of data, worker and logger
 * @param  {[type]} app [description]
 * @return promise
 */
module.exports.init = function(app) {
  initLocalFunctionsAliases();
  var dfd = q.defer();
  var credentials = getComposrCoreCredentials();
  var retries = config('services.retries');
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
};

module.exports.setWorkerStatus = function(bool) {
  workerStatus = bool;
};

module.exports.getWorkerStatus = function() {
  return workerStatus;
};

module.exports.abort = function() {
  shouldAbort = true; 
};
