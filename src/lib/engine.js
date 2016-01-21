'use strict'

var logger = require('../utils/composrLogger')
var composr = require('composr-core')
var q = require('q')
var https = require('https')
var hub = require('./hub')
var config = require('./config')

var engine = {
  suscribeToCoreEvents: function () {
    engine.composr.events.on('debug', 'CorbelComposr', function () {
      logger.debug.apply(logger, arguments)
    })

    engine.composr.events.on('error', 'CorbelComposr', function () {
      logger.error.apply(logger, arguments)
    })

    engine.composr.events.on('warn', 'CorbelComposr', function () {
      logger.warn.apply(logger, arguments)
    })

    engine.composr.events.on('info', 'CorbelComposr', function () {
      logger.info.apply(logger, arguments)
    })

    engine.composr.events.on('phrase:registered', 'CorbelComposr', function (phrase) {
      hub.emit('create:routes', phrase)
    })

    engine.composr.events.on('metrics', 'CorbelComposr', function (options) {
      hub.emit('metrics', options.domain, options.data)
    })
  },

  /* ***********************************************************
   * - Deletes timeout handler
   * - Resolves service checking request if response is sent from server
   * - Rejects service checking request if 'error' evt or timeout while waiting for response
   * @param  {Function} resolve Services to check
   * @param  {Function} reject Timeout before reject promise
   * @param  {String} module service currently checking
   * @param  {Object} promiseTimeoutHandler Timeout handler
   * @return nothing
   *************************************************************/

  resolveOrRejectServiceCheckingRequest: function (resolve, reject, request, module, promiseTimeoutHandler, rejectMessage) {
    if (promiseTimeoutHandler) {
      clearTimeout(promiseTimeoutHandler)
    }
    if (resolve) {
      logger.info('External service', module, 'is UP')
      resolve()
    } else if (reject) {
      rejectMessage = rejectMessage || ''
      logger.error('External service', module, 'is DOWN')
      reject(rejectMessage)
    }
  },

  /* ***********************************************************
   * - Initializes how a request is made
   * @param  {String} url to send request
   * @param  {Function} to execute when request is successfully replied
   * @param  {Function} to execute when request is not replied
   * @param  {Object} that holds a reference to request
   * @param  {Function} reference to timeout for this request
   * @param  {String} data that server sends
   *************************************************************/

  setUpRequest: function (url, module, resolve, reject, serviceCheckingRequestTimeout) {
    var promiseTimeoutHandler
    var request = https.get(url, function (res) {
      var responseData = ''
      res.on('data', function (chunk) {
        responseData += chunk
      })
      res.on('end', function () {
        if (engine.resolveOrRejectServiceCheckingRequest) {
          var isValidResponse = (res.statusCode === 200)
          var bodyContainsError = (responseData.indexOf('error') > -1 || responseData.indexOf('err') > -1)
          if (isValidResponse && !bodyContainsError) {
            engine.resolveOrRejectServiceCheckingRequest(resolve, null, request, module, promiseTimeoutHandler, null)
          } else {
            engine.resolveOrRejectServiceCheckingRequest(null, reject, request, module, promiseTimeoutHandler, 'JSON error')
          }
        }
      })
    })
      .on('error', function (err) {
        // resolveOrRejectServiceCheckingRequest === undefined -> Promises is already resolved
        if (engine.resolveOrRejectServiceCheckingRequest) {
          engine.resolveOrRejectServiceCheckingRequest(null, reject, request, module, promiseTimeoutHandler, err)
        }
      })

    promiseTimeoutHandler = setTimeout(function () {
      request.abort()
      engine.resolveOrRejectServiceCheckingRequest(null, reject, request, module, promiseTimeoutHandler, 'Request timeout fired')
    }, serviceCheckingRequestTimeout)
    return request
  },

  /* ***********************************************************
   * - Launches services checking requests
   * @param  {Array} modules Services to check
   * @param  {integer} serviceCheckingRequestTimeout Timeout before reject promise
   * @return {Array} promises
   *************************************************************/

  initServiceCheckingRequests: function (modules, serviceCheckingRequestTimeout) {
    var path = config('corbel.driver.options').urlBase

    return modules.map(function (module) {
      var url

      logger.info('Checking for external service', module)
      return new Promise(function (resolve, reject) {
        url = path.replace('{{module}}', module).replace(/\/(v.+)\//, '/') + 'version'
        engine.setUpRequest(url, module, resolve, reject, serviceCheckingRequestTimeout)
      })
    })
  },

  // Recursivelly wait until all the corbel services are up
  waitTilServicesUp: function () {
    var modules = ['iam', 'resources']
    var serviceCheckingRequestTimeout = config('services.timeout')
    var promises = engine.initServiceCheckingRequests(modules, serviceCheckingRequestTimeout)
    return Promise.all(promises)
  },

  // Returns the credentials for the composr-core initialization
  getComposrCoreCredentials: function () {
    return {
      credentials: {
        clientId: config('corbel.composr.credentials').clientId,
        clientSecret: config('corbel.composr.credentials').clientSecret,
        scopes: config('corbel.composr.credentials').scopes
      },
      urlBase: config('corbel.driver.options').urlBase
    }
  },

  // Inits the composr-core package
  initComposrCore: function (credentials, fetchData) {
    return new Promise(function (resolve, reject) {
      engine.composr.init(credentials, fetchData)
        .then(function () {
          engine.initialized = true
          var msg = fetchData ? 'Engine initialized with data! :)' : 'Engine initialized without data'
          logger.info(msg)
          resolve()
        })
        .catch(function (err) {
          engine.initialized = false
          logger.error('ERROR launching composr, please check your credentials and network')
          reject(err)
        })
    })
  },

  launchTries: function (time, retries) {
    if (!time) {
      time = config('services.time')
    }
    if (!retries) {
      retries = config('services.retries')
    }

    return new Promise(function (resolve, reject) {
      function launch (retries) {
        if (!retries) {
          return reject()
        }
        engine.waitTilServicesUp()
          .then(function () {
            logger.info('All Services up and running!')
            resolve()
          })
          .catch(function () {
            logger.info('Retrying services check after', time * retries, 'milliseconds')
            setTimeout(function () {
              return launch(retries - 1)
            }, time * retries)
          })
      }
      launch(retries)
    })
  },

  /**
   * Launches the bootstrap of data, worker and logger
   * @param  {[type]} app [description]
   * @return promise
   */
  init: function (app) {
    var dfd = q.defer()
    var retries = config('services.retries')
    var fetchData = true

    // Suscribe to log events
    engine.suscribeToCoreEvents()

    engine.launchTries(retries)
      .then(function () {
        engine.initComposrCore(engine.getComposrCoreCredentials(), fetchData)
          .then(function () {
            dfd.resolve({
              app: app,
              composr: engine.composr,
              initialized: engine.initialized
            })
          })
          .catch(dfd.reject)
      })
      .catch(function () {
        engine.initComposrCore(engine.getComposrCoreCredentials(), !fetchData)
          .then(function () {
            dfd.resolve({
              app: app,
              composr: engine.composr,
              initialized: engine.initialized
            })
            logger.info('The server is launched, delaying the fetch data')
          })
          .then(function () {
            tryAgain()
          })
          .catch(dfd.reject)
      })

    function tryAgain () {
      engine.launchTries(retries)
        .then(function () {
          logger.info('Data is available, fetching')
          engine.initComposrCore(engine.getComposrCoreCredentials(), fetchData)
        })
        .catch(function () {
          // If the services were unavailable delay the retries and go on
          logger.error('Services where unaccesible after ' + retries + ' retries')
          tryAgain()
        })
    }
    return dfd.promise
  },

  setWorkerStatus: function (bool) {
    engine.workerStatus = bool
  },

  getWorkerStatus: function () {
    return engine.workerStatus
  }
}

engine.initialized = false
engine.workerStatus = false
engine.phrasesCollection = 'composr:Phrase'
engine.snippetsCollection = 'composr:Snippet'
engine.composr = composr
module.exports = engine
