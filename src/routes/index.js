'use strict'

module.exports = function (server) {
  require('./base')(server)
  require('./doc')(server)
  require('./phrase')(server)
  require('./snippet')(server)
  require('./test')(server)
}
