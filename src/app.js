/* ************************************
  Server Config and Load
**************************************/
'use strict'
try {
  var restify = require('restify')
  var hub = require('./lib/hub')
  var srvConf = require('./lib/server')
  var server = restify.createServer(srvConf)
  require('./lib/router')(server)
  var engine = require('./lib/engine')
  var config = require('./lib/config')
  var configChecker = require('./utils/envConfigChecker')
  var logger = require('./utils/composrLogger')
  var ComposrError = require('./lib/ComposrError')

  /* ************************************
    Configuration check
  **************************************/
  var env = process.env.NODE_ENV || 'development'
  configChecker.checkConfig(env)

  /* ************************************
    Middlewares
  **************************************/
  logger.info('Loading Middlewares...')
  require('./middlewares')(restify, server, config, logger)

  /* ************************************
    Metrics
  **************************************/
  logger.info('Initializing metrics...')
  require('./metrics')(restify, server, config, logger)

  /* ************************************
    Error handlers
  **************************************/

  server.on('NotFound', function (req, res, err, next) {
    err = new ComposrError('error:not_found', err.message, 404)
    res.send(404, err)
    next() // Necesary for triggering request end
  })

  server.on('InternalServer', function (req, res, err, next) {
    logger.warn('Error caught by router InternalServer')
    err = new ComposrError('error:internal:server:error', err.message, 500)
    res.send(500, err)
    next() // Necesary for triggering request end
  })

  server.on('uncaughtException', function (req, res, route, err) {
    // uncaughtException errors doesn't emit a "server after" event
    if (res.headersSent) {
      return (false)
    }

    if (err instanceof ComposrError === false) {
      err = new ComposrError('error:internal:server:error', err.message, err.status || err.statusCode || 500)
    }
    var status = err.statusCode || err.status || 500
    var body = err.body || err.data || err

    logger.warn('Error caught by router uncaughtException')
    logger.error(status, body, route)

    res.send(status, body)
    hub.emit('http:end', req, res)
  })

  process.on('uncaughtException', function (err) {
    logger.warn('Error caught by uncaughtException')
    logger.error(err)
    if (!err || err.message !== "Can't set headers after they are sent.") {
      process.exit(1)
    }
  })

  /* ************************************
    Initialization
  **************************************/

  // Trigger the static routes creation
  hub.emit('create:staticRoutes', server)
} catch (e) {
  console.error(e)
}
module.exports = engine.init(server)
