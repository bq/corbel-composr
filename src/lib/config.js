'use strict';

var _ = require('lodash'),
  fs = require('fs'),
  ComposerError = require('./composerError');

var env = process.env.NODE_ENV || 'development';
var config = require('../config/config.json');


//Check if environment config file exists and overwrite the defaults
var environmentFileConfig = env + '.json';

try {
  var fstat = fs.statSync(__dirname + '/../config/' + environmentFileConfig);
  if (fstat.isFile()) {
    var envConfigFile = require('../config/' + environmentFileConfig);
    config = _.defaults(envConfigFile, config);
  }
} catch (e) {
  console.log('warn:config:' + env + ':undefined');
}

//Finally if it exists on the environment, use this
if (process.env.COMPOSR_CONFIG) {
  try {
    var envConfig = typeof(process.env.COMPOSR_CONFIG) === 'object' ? process.env.COMPOSR_CONFIG : JSON.parse(process.env.COMPOSR_CONFIG);
    config = _.defaults(envConfig, config);
  } catch (e) {
    console.log(e);
    console.log('warn:config:badformatedConfig' + env + ':undefined', process.env.COMPOSR_CONFIG);
  }
}

if (process.env.CREDENTIALS_CLIENT_ID) {
  config['corbel.composer.credentials'].clientId = process.env.CREDENTIALS_CLIENT_ID;
}

if (process.env.CREDENTIALS_CLIENT_SECRET) {
  config['corbel.composer.credentials'].clientSecret = process.env.CREDENTIALS_CLIENT_SECRET;
}

if (process.env.CREDENTIALS_SCOPES) {
  config['corbel.composer.credentials'].scopes = process.env.CREDENTIALS_SCOPES;
}

if (process.env.URL_BASE) {
  config['corbel.driver.options'].urlBase = process.env.URL_BASE;
}

if (process.env.LOG_LEVEL) {
  config.logLevel = process.env.LOG_LEVEL;
}

if (process.env.LOG_FILE) {
  config.logFile = process.env.LOG_FILE;
}

if (process.env.RABBITMQ_HOST) {
  config['rabbitmq.host'] = process.env.RABBITMQ_HOST;
}

if (process.env.RABBITMQ_EVENT) {
  config['rabbitmq.event'] = process.env.RABBITMQ_EVENT;
}

if (process.env.RABBITMQ_PORT) {
  config['rabbitmq.port'] = process.env.RABBITMQ_PORT;
}

if (process.env.RABBITMQ_USERNAME) {
  config['rabbitmq.username'] = process.env.RABBITMQ_USERNAME;
}

if (process.env.RABBITMQ_PASSWORD) {
  config['rabbitmq.password'] = process.env.RABBITMQ_PASSWORD;
}


module.exports = function(key, haltOnUndefined) {
  if (!key) {
    return _.cloneDeep(config);
  } else if (typeof(config[key]) === 'undefined' && haltOnUndefined) {
    throw new ComposerError('error:composr:config:undefined', '', 500);
  } else {
    return _.cloneDeep(config[key]);
  }
};