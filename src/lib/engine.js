'use strict'

var logger = require('../utils/composrLogger')
var composr = require('composr-core')
var corbelConnection = require('./connectors/corbel')
var hub = require('./hub')
var config = require('config')
var WorkerClass = require('./rabbitMQworker')
var worker

var engine = {
  initialized: false,
  composr: composr,

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
  init: function (app, localMode, serverID, maxServicesRetries) {
    return new Promise(function (resolve, reject) {
      // Suscribe to log events
      engine.suscribeToCoreEvents()

      worker = new WorkerClass(engine, serverID)

      if (localMode) {
        logger.info('>>> Launching server in local mode')
        logger.info('        No RabbitMQ connection will be stablished')
        logger.info('        It will not fetch endpoints from Corbel')
        engine.launchWithoutData(app, {resolve, reject}, function () {
          // engine.tryToFindLocalPhrases()
          console.log('... I want to load phrases and snippets from the current directory')
        })
        return
      }

      // Mandatory pings that will trigger the execution of the server
      hub.once('corbel:ready', function () {
        engine.launchWithData(app, {resolve, reject})
      })

      hub.once('corbel:not:ready', function () {
        // For some reason corbel wasnt up, so we wait until it is ready. but for the moment we start the server
        engine.launchWithoutData(app, {resolve, reject}, function () {
          logger.info('The server is launched, delaying the fetch data')
          engine._waitUntilCorbelIsReadyAndFetchData()
        })
      })

      // Make the necessary calls that will result in the 'corbel:ready' or 'corbel:not:ready' events
      if (config.get('rabbitmq.forceconnect') && worker.canConnect()) {
        logger.info('>>> The server will start after RabbitMQ is connected')
        logger.info('>>> You can disable this behaviour by changing rabbitmq.forceconnect to false ' +
          'in the configuration file or sending RABBITMQ_FORCE_CONNECT environment variable to false')

        engine.initWorker(worker, engine.pingCorbel)
      } else {
        if (!worker.canConnect()) {
          logger.info('>>> RabbitMQ worker will not be connectLed')
        } else {
          logger.warn('>>> The server will start even if RabbitMQ is NOT connected')
          engine.initWorker(worker)
        }

        engine.pingCorbel(maxServicesRetries)
      }
    })
  },

  initWorker: function (worker, cb) {
    worker.init(cb)
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

  pingCorbel: function (maxServicesRetries) {
    corbelConnection.waitUntilCorbelIsReady(maxServicesRetries)
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

module.exports = engine
