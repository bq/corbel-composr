'use strict'

module.exports = function (restify, server, config, logger) {
  require('./keymetrics')(config, logger)
// require('./newrelic')(restify, server, config, logger)
}
