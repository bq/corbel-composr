'use strict';

var winston = require('winston');
var mkdirp = require('mkdirp');
var art = require('ascii-art');
var config = require('../lib/config');
var logLevel = config('logLevel') ? config('logLevel') : false;
var logFile = config('logFile') ? config('logFile') : false;

var loggerEnabled = logLevel ? true : false;
var logger;

if (loggerEnabled) {

  //Default transports
  var transports = [
    new(winston.transports.Console)({
      level: logLevel,
      colorize: true
    })
  ];

  if (logFile) {
    //If file log is enabled, create the directory
    var logDirs = logFile.split('/').slice(0, -1).join('/');

    mkdirp.sync(logDirs);

    transports.push(new(winston.transports.File)({
      name: 'error-file',
      filename: logFile,
      level: logLevel
    }));
  }

  //Initialize logger
  logger = new(winston.Logger)({
    transports: transports
  });
}

/**
  Logger levels
  @todo: Prevent circular reference problem
**/
function error() {
  if (loggerEnabled) {
    logger.log.apply(logger, ['error'].concat(Array.prototype.slice.call(arguments)));
  }
}

function info() {
  if (loggerEnabled) {
    logger.log.apply(logger, ['info'].concat(Array.prototype.slice.call(arguments)));
  }
}

function warn() {
  if (loggerEnabled) {
    logger.log.apply(logger, ['warn'].concat(Array.prototype.slice.call(arguments)));
  }
}

function debug() {
  if (loggerEnabled) {
    try {
      logger.log.apply(logger, ['debug'].concat(Array.prototype.slice.call(arguments)));
    } catch (e) {
      // circular serialization
    }
  }
}

function fancy(text, cb) {
  art.font(text, 'Basic', 'green', function(rendered) {
    console.log(rendered);
    cb();
  });
}

function salute(cb) {
  art.font('compoSR', 'Basic', 'red').font('v1', 'Doom', 'magenta', function(rendered) {
    console.log(rendered);
    cb();
  });
}

module.exports = {
  error: error,
  info: info,
  debug: debug,
  warn: warn,
  fancy: fancy,
  salute: salute
};