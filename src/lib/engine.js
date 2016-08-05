'use strict'

var logger = require('../utils/composrLogger')
var composr = require('composr-core')
var corbelConnection = require('./connectors/corbel')
var redisConnection = require('./connectors/redis')
var cache = require('./modules/cache')
var hub = require('./hub')
var config = require('config')
var composrBuild = require('../../node_modules/composr-cli/dist/build')
var WorkerClass = require('./rabbitMQworker')
var worker

var engine = {
  initialized: false,
  services: {
    redis: false,
    corbel: false,
    rabbit: false
  },
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

  /* *********************************************************
    Suscribe to cache module
  ***********************************************************/
  suscribeToCacheEvents: function () {
    // TODO: temporal patch for not having duplicate events on tests
    hub.removeAllListeners('cache-add')
    hub.removeAllListeners('cache-remove')

    hub.on('cache-add', cache.add)

    hub.on('cache-remove', cache.remove)
  },

  // Returns the credentials for the composr-core initialization
  getComposrCoreCredentials: function () {
    var configuration = {}
    try{
        configuration = {
          credentials: {
          clientId: config.get('corbel.credentials.clientId'),
          clientSecret: config.get('corbel.credentials.clientSecret'),
          scopes: config.get('corbel.credentials.scopes')
        },
        urlBase: config.get('corbel.options.urlBase')
      }
    } catch (e) {
      console.log(e)
    }
    return configuration
  },

  // Inits the composr-core package
  initComposrCore: function () {
    var credentials = engine.getComposrCoreCredentials()
    var fetchData = engine.services.corbel // If corbel is connected launch with data
    return new Promise(function (resolve, reject) {
      engine.composr.init(credentials, fetchData)
        .then(function () {
          engine.initialized = true
          var msg = fetchData ? 'Engine initialized with data! :)' : 'Engine initialized without data'
          logger.info('[Engine]', msg)
          resolve()
        })
        .catch(function (err) {
          engine.initialized = false
          logger.error('[Engine]', 'ERROR launching composr, please check your credentials and network')
          logger.error(err)
          reject(err)
        })
    })
  },

  _waitUntilCorbelIsReadyAndFetchData: function () {
    var self = this
    corbelConnection.waitUntilCorbelIsReady()
      .then(function () {
        self.services.corbel = true
        logger.info('[Engine]', 'Data is available, fetching')
        engine.initComposrCore()
      })
      .catch(function () {
        // If the services were unavailable delay the retries and go on
        logger.error('[Engine]', 'Services where unaccesible after ' + config.get('services.retries') + ' retries')
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
      engine.suscribeToCacheEvents()

      engine.checkServices()
        .then(function () {
          engine.outputSystemInfo(localMode)

          if (localMode) {
            engine.initLocalMode(app, {resolve, reject})
            return
          }

          worker = new WorkerClass(engine, serverID)

          // Mandatory pings that will trigger the execution of the server
          hub.once('corbel:ready', function () {
            engine.services.corbel = true
            engine.launch(app, {resolve, reject})
          })

          hub.once('corbel:not:ready', function () {
            engine.services.corbel = false
            // For some reason corbel wasnt up, so we wait until it is ready. but for the moment we start the server
            engine.launch(app, {resolve, reject}, function () {
              logger.info('[Engine]', 'The server is launched, delaying the fetch data')
              engine._waitUntilCorbelIsReadyAndFetchData()
            })
          })

          // Make the necessary calls that will result in the 'corbel:ready' or 'corbel:not:ready' events
          if (config.get('rabbitmq.forceconnect') && worker.canConnect()) {
            logger.info('[Engine]', '>>> The server will start after RabbitMQ is connected')
            logger.info('[Engine]', '>>> You can disable this behaviour by changing rabbitmq.forceconnect to false ' +
              'in the configuration file or sending RABBITMQ_FORCE_CONNECT environment variable to false')

            engine.initWorker(worker, engine.waitUntilCorbelConnected)
          } else {
            if (!worker.canConnect()) {
              logger.info('[Engine]', '>>> RabbitMQ worker will not be connectLed')
            } else {
              logger.warn('[Engine]', '>>> The server will start even if RabbitMQ is NOT connected')
              engine.initWorker(worker)
            }

            engine.waitUntilCorbelConnected(maxServicesRetries)
          }
        })
    })
  },

  outputSystemInfo: function (localMode) {
    logger.info('[Engine]', '=========== System information ===========')

    if (localMode) {
      logger.info('[Engine]', '    >>> Launching server in local mode')
      logger.info('[Engine]', '        No RabbitMQ connection will be stablished')
      logger.info('[Engine]', '        It will not fetch endpoints from Corbel')
    } else {
      logger.info('[Engine]', '    >>> Launching server in remote mode')
      logger.info('[Engine]', '        It will not search for endpoints in current folder')
    }

    logger.info('[Engine]', '    >>> Execution information')
    logger.info('[Engine]', '        Endpoint timeout', config.get('execution.timeout'))
    logger.info('[Engine]', '        Use VM?', config.get('execution.vm'))
    logger.info('[Engine]', '        Enforce garbage collector?', config.get('execution.gc'))

    logger.info('[Engine]', '    >>> Remote services')

    if (engine.services.redis) {
      logger.info('[Engine]', '       ✓ Redis Cache Connected')
    } else {
      logger.info('[Engine]', '       ✘ No Redis Cache')
    }

    if (engine.services.corbel) {
      logger.info('[Engine]', '       ✓ Corbel Connected')
    } else {
      logger.info('[Engine]', '       ✘ Corbel Connected')
    }
  },

  checkServices: function () {
    var promises = [redisConnection.checkState(), corbelConnection.pingAll(500)]

    return Promise.all(promises)
      .then(function (results) {
        engine.services.redis = results[0]
        engine.services.corbel = results[1]
      })
  },

  /*
    Local mode reads phrases from current directory and dont fetch data from corbel.
    It does not connect to rabbit.
   */
  initLocalMode: function (app, promise) {
    engine.services.corbel = false

    engine.launch(app, promise, function () {
      logger.info('[Engine]', 'Trying to find phrases in the current directory')
      composrBuild({
        version: '0.0.0'
      }, function (err, items) {
        if (err) {
          logger.error('[Engine]', 'Error loading local data', err)
          return
        }

        Promise.all([
          engine.composr.Phrase.register(global.domain || 'composr', items.phrases),
          engine.composr.Snippet.register(global.domain || 'composr', items.snippets)
        ])
          .then(function () {
            logger.info('[Engine]', 'Loaded local phrases and snippets')
          })
      })
    })
  },

  initWorker: function (worker, cb) {
    worker.init(cb)
  },

  launch: function (app, promise, cb) {
    engine.initComposrCore()
      .then(function () {
        promise.resolve({
          app: app,
          composr: engine.composr,
          hub: hub,
          initialized: engine.initialized
        })

        if (cb) {
          cb()
        }
      })
      .catch(promise.reject)
  },

  waitUntilCorbelConnected: function (maxServicesRetries) {
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
