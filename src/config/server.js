/*************************************
  Server Config and Load
**************************************/
var bunyan = require('bunyan');
var restify = require('restify');
var config = require('../lib/config');

var _server = {
  name: config('serverName') // Server Name
};

if (config('requestLog') === true) {
  _server = {
    name: config('serverName'), // Server Name
    log: bunyan.createLogger({
      name: config('serverName'), // Logs server name
      streams: [{
        level: 'debug', // Loggin depth
        stream: process.stdout // log INFO and above to stdout
      }, {
        level: 'error',
        path: './logs/api-error.log' // log ERROR and above to a file
      }, {
        level: 'trace',
        path: './logs/api.log'
      }],
      serializers: restify.bunyan.serializers
    })
  };
}

module.exports = _server;
