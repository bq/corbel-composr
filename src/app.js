/* ************************************
  Server Config and Load
**************************************/
'use strict'

var restify = require('restify')
var hub = require('./lib/hub')
var srvConf = require('./lib/server')
var server = restify.createServer(srvConf)
require('./lib/router')(server)
var engine = require('./lib/engine')
var config = require('config')
var configChecker = require('./utils/envConfigChecker')
var logger = require('./utils/composrLogger')
var ComposrError = require('composr-core').ComposrError
var yn = require('yn')

/* ************************************
  Configuration check
**************************************/
configChecker.checkConfig()

/* ************************************
  Middlewares
**************************************/
logger.info('[App]', 'Loading Middlewares...')
require('./middlewares')(restify, server, config, logger)

/* ************************************
  Metrics
**************************************/
logger.info('[App]', 'Initializing metrics...')
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
  logger.warn('[App]', 'Error caught by router InternalServer', req.path())
  err = new ComposrError('error:internal:server:error', err.message, 500)
  res.send(500, err)
  next() // Necesary for triggering request end
})

server.on('uncaughtException', function (req, res, route, err) {
  // uncaughtException errors doesn't emit a "server after" event
  if (res.headersSent) {
    return (false)
  }
  var status = err.statusCode || err.status || 500
  var body = err.message || err.errorDescription || err.body || err.data || err

  if (err instanceof ComposrError === false) {
    err = new ComposrError('error:internal:server:error', body, status)
  }

  logger.warn('[App]', 'Error caught by router uncaughtException', req.path())
  logger.error(status, body, route)

  res.send(status, err)
  hub.emit('http:end', req, res)
})

process.on('uncaughtException', function (err) {
  logger.warn('[App]', 'Error caught by uncaughtException')
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

module.exports = function (serverID) {
  var localMode = config.get('execution.local')
  return engine.init(server, yn(localMode), serverID)
}
