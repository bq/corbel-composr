/* ************************************
  Bunyan Logger
**************************************/
var config = require('./config')
var bunyanLogger = require('../utils/bunyanLogger')
var restify = require('restify')
var jsonFormatter = restify.formatters['application/json; q=0.4']
var ComposrError = require('./ComposrError')

var _server = {
  name: config('serverName'),
  log: bunyanLogger,

  formatters: {
    'application/json; q=0.4': function formatterJson (req, res, body, next) {
      if (body instanceof Error && !body.body) {
        // Parse all errors to restify errors
        body = new ComposrError(body.error || body.message, body.errorDescription || body.code || body.stack,
          body.status || body.statusCode || 500)
      }

      return jsonFormatter(req, res, body, next)
    }
  }
}

module.exports = _server
