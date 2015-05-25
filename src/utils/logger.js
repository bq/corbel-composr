'use strict';

var winston = require('winston');
var config = require('../config/config');
var logLevel = config.logLevel ? config.logLevel : 'error';
var logFile = config.logFile ? config.logFile : 'logs/composr.log';
var useSyslog = config.syslog;

require('winston-syslog').Syslog; // jshint ignore:line

//Default transports
var transports = [
  new (winston.transports.Console)({
    level : logLevel,
    colorize: true
  }),
  new (winston.transports.File)({
    name: 'error-file',
    filename: logFile,
    level: logLevel
  })
];

//Check if we want to use syslog
if(useSyslog){
  var syslogOptions = {
    app_name : 'composr',// jshint ignore:line
    protocol: 'unix',
    path: '/dev/log',
    level : logLevel
  };

  transports.push(new (winston.transports.Syslog)(syslogOptions));
}

//Initialize logger
var logger = new (winston.Logger)({
  transports: transports
});

/**
  Logger levels
**/
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
