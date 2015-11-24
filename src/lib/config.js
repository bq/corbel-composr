'use strict';

var _ = require('lodash'),
  fs = require('fs'),
  ComposrError = require('./ComposrError');

function getDefaultConfig() {
  return require('../config/config.json');
}

function getConfigFromFile(environment) {
  var environmentFileConfig = environment + '.json';
  var configuration = {};

  try {
    var fstat = fs.statSync(__dirname + '/../config/' + environmentFileConfig);
    if (fstat.isFile()) {
      configuration = require('../config/' + environmentFileConfig);
    }
  } catch (e) {
    console.log('warn:config:' + environment + ':undefined');
  }

  return configuration;
}

function isDefinedConfigValue(val) {
  return typeof(val) !== 'undefined' && val !== '\'\'';
}

function getInitialConfig() {
  var env = process.env.NODE_ENV || 'development';
  var environmentFileConfig = getConfigFromFile(env);
  var defaultConfig = getDefaultConfig();
  var config = _.defaults(environmentFileConfig, defaultConfig);



  //Finally if it exists on the environment, use this
  if (isDefinedConfigValue(process.env.COMPOSR_CONFIG)) {
    console.log('warn:config: DEPRECATED ENVIRONMENT VARIABLE COMPOSR_CONFIG');

    try {
      var envConfig = typeof(process.env.COMPOSR_CONFIG) === 'object' ? process.env.COMPOSR_CONFIG : JSON.parse(process.env.COMPOSR_CONFIG);
      config = _.defaults(envConfig, config);
    } catch (e) {
      console.log(e);
      console.log('warn:config:badformatedConfig' + env + ':undefined', process.env.COMPOSR_CONFIG);
    }
  }
  //store environment variable
  config.env = env;

  return config;
}

var initialConfig = getInitialConfig();

if (isDefinedConfigValue(process.env.CREDENTIALS_CLIENT_ID)) {
  initialConfig['corbel.composr.credentials'].clientId = process.env.CREDENTIALS_CLIENT_ID;
}

if (isDefinedConfigValue(process.env.CREDENTIALS_CLIENT_SECRET)) {
  initialConfig['corbel.composr.credentials'].clientSecret = process.env.CREDENTIALS_CLIENT_SECRET;
}

if (isDefinedConfigValue(process.env.CREDENTIALS_SCOPES)) {
  initialConfig['corbel.composr.credentials'].scopes = process.env.CREDENTIALS_SCOPES;
}

if (isDefinedConfigValue(process.env.URL_BASE)) {
  initialConfig['corbel.driver.options'].urlBase = process.env.URL_BASE;
}

if (isDefinedConfigValue(process.env.ACCESS_LOG)) {
  initialConfig.accessLog = process.env.ACCESS_LOG;
}

if (isDefinedConfigValue(process.env.ACCESS_LOG_FILE)) {
  initialConfig.accessLogFile = process.env.ACCESS_LOG_FILE;
}

if (isDefinedConfigValue(process.env.LOG_FILE)) {
  initialConfig.logFile = process.env.LOG_FILE;
}

if (isDefinedConfigValue(process.env.LOG_LEVEL)) {
  initialConfig.logLevel = process.env.LOG_LEVEL;
}

if (isDefinedConfigValue(process.env.LOG_FILE)) {
  initialConfig.logFile = process.env.LOG_FILE;
}

if (isDefinedConfigValue(process.env.RABBITMQ_HOST)) {
  initialConfig['rabbitmq.host'] = process.env.RABBITMQ_HOST;
}

if (isDefinedConfigValue(process.env.RABBITMQ_PORT)) {
  initialConfig['rabbitmq.port'] = process.env.RABBITMQ_PORT;
}

if (isDefinedConfigValue(process.env.RABBITMQ_USERNAME)) {
  initialConfig['rabbitmq.username'] = process.env.RABBITMQ_USERNAME;
}

if (isDefinedConfigValue(process.env.RABBITMQ_PASSWORD)) {
  initialConfig['rabbitmq.password'] = process.env.RABBITMQ_PASSWORD;
}

if (isDefinedConfigValue(process.env.NRACTIVE)) {
  initialConfig.newrelic = process.env.NRACTIVE;
}

if (isDefinedConfigValue(process.env.NRAPPNAME)) {
  initialConfig['newrelic.name'] = process.env.NRAPPNAME;
}

if (isDefinedConfigValue(process.env.NRAPIKEY)) {
  initialConfig['newrelic.key'] = process.env.NRAPIKEY;
}

if (isDefinedConfigValue(process.env.SERVICES_TIMEOUT)) {
  initialConfig['services.timeout'] = process.env.SERVICES_TIMEOUT;
}

if (isDefinedConfigValue(process.env.SERVICES_RETRIES)) {
  initialConfig['services.retries'] = process.env.SERVICES_RETRIES;
}

if (isDefinedConfigValue(process.env.SERVICES_TIME)) {
  initialConfig['services.time'] = process.env.SERVICES_TIME;
}

module.exports = function(key, haltOnUndefined) {
  if (!key) {
    return _.cloneDeep(initialConfig);
  } else if (typeof(initialConfig[key]) === 'undefined' && haltOnUndefined) {
    throw new ComposrError('error:composr:config:undefined', '', 500);
  } else {
    return _.cloneDeep(initialConfig[key]);
  }
};
