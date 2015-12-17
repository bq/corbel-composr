/* ************************************
  Bunyan Logger
**************************************/
var config = require('./config')
var bunyanLogger = require('../utils/bunyanLogger')

var _server = {
  name: config('serverName'),
  log: bunyanLogger
}

module.exports = _server
