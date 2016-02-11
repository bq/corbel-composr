'use strict'

module.exports = function (server) {
  require('./base')(server)
  require('./doc')(server)
  require('./phrase').loadRoutes(server)
  require('./snippet').loadRoutes(server)
  require('./domain').loadRoutes(server)
  require('./test')(server)
}
