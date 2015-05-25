'use strict';

var winston = require('winston');
var config = require('../config/config');
var logLevel = config.logLevel ? config.logLevel : 'error';
var logFile = config.logFile ? config.logFile : 'logs/composr.log';

var syslogOptions = {
  app_name : 'composr',// jshint ignore:line
  protocol: 'unix',
  path: '/dev/log'
};

require('winston-syslog').Syslog; // jshint ignore:line

//winston.add(winston.transports.Syslog, options);

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level : logLevel,
      colorize: true
    }),
    new (winston.transports.File)({
      name: 'error-file',
      filename: logFile,
      level: logLevel
    }),
    new (winston.transports.Syslog)(syslogOptions)
  ]
});

function error(){
  logger.log.apply(logger, ['error'].concat(Array.prototype.slice.call(arguments)));
}

function info(){
  logger.log.apply(logger, ['info'].concat(Array.prototype.slice.call(arguments)));
}

function warn(){
  logger.log.apply(logger, ['warn'].concat(Array.prototype.slice.call(arguments)));
}

function debug(){
  logger.log.apply(logger, ['debug'].concat(Array.prototype.slice.call(arguments)));
}

module.exports = {
  error : error,
  info : info,
  debug : debug,
  warn : warn
};
