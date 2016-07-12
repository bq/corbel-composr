'use strict'

var logger = require('../utils/composrLogger')
var composr = require('composr-core')
var corbelConnection = require('./connectors/corbel')
var https = require('https')
var hub = require('./hub')
var config = require('config')
var WorkerClass = require('./rabbitMQworker')
var worker

var engine = {
  /* ***********************************************************
   * - Suscribes to the Composr-Core log events
   * @return nothing
   *************************************************************/

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

  resolveOrRejectServiceCheckingRequest: function (resolve, reject, request, module, promiseTimeoutHandler, rejectMessage, url) {
    if (promiseTimeoutHandler) {
      clearTimeout(promiseTimeoutHandler)
    }
    if (resolve) {
      logger.info('External service', module, 'is UP', url)
      resolve()
    } else if (reject) {
      rejectMessage = rejectMessage || ''
      logger.error('External service', module, 'is DOWN', url)
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
            engine.resolveOrRejectServiceCheckingRequest(resolve, null, request, module, promiseTimeoutHandler, null, url)
          } else {
            engine.resolveOrRejectServiceCheckingRequest(null, reject, request, module, promiseTimeoutHandler, 'JSON error', url)
          }
        }
      })
    })
      .on('error', function (err) {
        // resolveOrRejectServiceCheckingRequest === undefined -> Promises is already resolved
        if (engine.resolveOrRejectServiceCheckingRequest) {
          engine.resolveOrRejectServiceCheckingRequest(null, reject, request, module, promiseTimeoutHandler, err, url)
        }
      })

    promiseTimeoutHandler = setTimeout(function () {
      request.abort()
      engine.resolveOrRejectServiceCheckingRequest(null, reject, request, module, promiseTimeoutHandler, 'Request timeout fired', url)
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
    var path = config.get('corbel.options.urlBase')

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
  _waitUntilCorbelModulesReady: function () {
    var modules = ['iam', 'resources', 'evci', 'assets']
    var serviceCheckingRequestTimeout = config.get('services.timeout')
    var promises = engine.initServiceCheckingRequests(modules, serviceCheckingRequestTimeout)
    return Promise.all(promises)
  },

  // Returns the credentials for the composr-core initialization
  getComposrCoreCredentials: function () {
    return {
      credentials: {
        clientId: config.get('corbel.credentials.clientId'),
        clientSecret: config.get('corbel.credentials.clientSecret'),
        scopes: config.get('corbel.credentials.scopes')
      },
      urlBase: config.get('corbel.options.urlBase')
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
          logger.error(err)
          reject(err)
        })
    })
  },

  _waitUntilCorbelIsReadyAndFetchData: function () {
    corbelConnection.waitUntilCorbelIsReady()
      .then(function () {
        logger.info('Data is available, fetching')
        engine.initComposrCore(engine.getComposrCoreCredentials(), true)
      })
      .catch(function () {
        // If the services were unavailable delay the retries and go on
        logger.error('Services where unaccesible after ' + config.get('services.retries') + ' retries')
        engine._waitUntilCorbelIsReadyAndFetchData()
      })
  },

  /**
   * Launches the bootstrap of data, worker and logger
   * @param  {[type]} app [description]
   * @return promise
   */
  init: function (app, localMode, serverID) {
    return new Promise(function (resolve, reject) {
      // Suscribe to log events
      engine.suscribeToCoreEvents()

      worker = new WorkerClass(engine, serverID)

      if (localMode) {
        engine.launchWithoutData(app, {resolve, reject}, function () {
          // engine.tryToFindLocalPhrases()
          console.log('... I want to load phrases and snippets from the current directory')
        })
        return
      }

      hub.on('corbel:ready', function () {
        engine.launchWithData(app, {resolve, reject})
      })

      hub.on('corbel:not:ready', function () {
        // For some reason corbel wasnt up, so we wait until it is ready. but for the moment we start the server
        engine.launchWithoutData(app, {resolve, reject}, function () {
          logger.info('The server is launched, delaying the fetch data')
          engine._waitUntilCorbelIsReadyAndFetchData()
        })
      })

      if (!worker.canConnect()) {
        logger.info('>>> RabbitMQ worker will not be connected')
      } else {
        worker.init()
      }

      if (config.get('rabbitmq.forceconnect') && worker.canConnect()) {
        logger.info('>>> The server will start after RabbitMQ is connected')
        logger.info('>>> You can disable this behaviour by changing rabbitmq.forceconnect to false ' +
          'in the configuration file or sending RABBITMQ_FORCE_CONNECT environment variable to false')
        hub.once('load:worker', function () {
          engine._init()
        })
      } else {
        logger.warn('>>> The server will start even if RabbitMQ is NOT connected')
        engine._init()
      }
    })
  },

  launchWithData: function (app, promise) {
    engine.initComposrCore(engine.getComposrCoreCredentials(), true)
      .then(function () {
        promise.resolve({
          app: app,
          composr: engine.composr,
          hub: hub,
          initialized: engine.initialized
        })
      })
      .catch(promise.reject)
  },

  launchWithoutData: function (app, promise, cb) {
    engine.initComposrCore(engine.getComposrCoreCredentials(), false)
      .then(function () {
        promise.resolve({
          app: app,
          hub: hub,
          composr: engine.composr,
          initialized: engine.initialized
        })

        if (cb) {
          cb()
        }
      })
      .catch(promise.reject)
  },

  _init: function () {
    corbelConnection.waitUntilCorbelIsReady()
      .then(function () {
        hub.emit('corbel:ready')
      })
      .catch(function () {
        hub.emit('corbel:not:ready')
      })
  },

  getWorkerStatus: function () {
    return worker.connectionStatus
  }
}

engine.initialized = false
engine.phrasesCollection = 'composr:Phrase'
engine.snippetsCollection = 'composr:Snippet'
engine.virtualDomainsCollection = 'composr:VirtualDomain'
engine.composr = composr
module.exports = engine
