'use strict'

module.exports = function (restify, server, config, logger) {
  require('./http')(restify, server, logger)
  require('./logs')(server, logger)
  require('./diagnose')(config, logger)
  require('./cookies')(server)
}
