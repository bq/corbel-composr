'use strict';

var logger = require('./logger');
var _ = require('lodash');
var fs = require('fs');

var env = process.env.NODE_ENV || 'development';
var config = require('../config/config.json');
var configPrepared;

//Check if environment config file exists and overwrite the defaults
var environmentFileConfig = env + '.json';
try {
  var fstat = fs.statSync(__dirname + '/../config/' + environmentFileConfig);
  if (fstat.isFile()) {
    var envConfigFile = require('../config/' + environmentFileConfig);
    configPrepared = _.defaults(envConfigFile, config);
  }
} catch (e) {
  logger.warn('config:' + env + ':undefined');
}

function isUndefinedConfigValue(val) {
  return typeof(val) === 'undefined' || val === '\'\'';
}

function isByDefaultConfigValue(val) {
  return _.isEqual(config[val], configPrepared[val]);
}

function checkIfEnvironmentVariablesArePresent() {
  var environmentCheckerLog = 'The next environment variables are not present: \n';
  var environmentCheckerBool = false;

  if (isUndefinedConfigValue(process.env.CREDENTIALS_CLIENT_ID)) {
    environmentCheckerLog = environmentCheckerLog + '   * CREDENTIALS_CLIENT_ID \n';
    environmentCheckerBool = true;
  }
  if (isUndefinedConfigValue(process.env.CREDENTIALS_CLIENT_SECRET)) {
    environmentCheckerLog = environmentCheckerLog + '   * CREDENTIALS_CLIENT_SECRET \n';
    environmentCheckerBool = true;
  }

  if (isUndefinedConfigValue(process.env.CREDENTIALS_SCOPES)) {
    environmentCheckerLog = environmentCheckerLog + '   * CREDENTIALS_SCOPES \n';
    environmentCheckerBool = true;
  }

  if (isUndefinedConfigValue(process.env.URL_BASE)) {
    environmentCheckerLog = environmentCheckerLog + '   * URL_BASE \n';
    environmentCheckerBool = true;
  }
  if (isUndefinedConfigValue(process.env.RABBITMQ_HOST)) {
    environmentCheckerLog = environmentCheckerLog + '   * RABBITMQ_HOST \n';
    environmentCheckerBool = true;
  }

  if (isUndefinedConfigValue(process.env.RABBITMQ_PORT)) {
    environmentCheckerLog = environmentCheckerLog + '   * RABBITMQ_PORT \n';
    environmentCheckerBool = true;
  }

  if (isUndefinedConfigValue(process.env.RABBITMQ_USERNAME)) {
    environmentCheckerLog = environmentCheckerLog + '   * RABBITMQ_USERNAME \n';
    environmentCheckerBool = true;
  }

  if (isUndefinedConfigValue(process.env.RABBITMQ_PASSWORD)) {
    environmentCheckerLog = environmentCheckerLog + '   * RABBITMQ_PASSWORD \n';
    environmentCheckerBool = true;
  }

  if (environmentCheckerBool) {
    environmentCheckerLog = environmentCheckerLog +
      'Looks that you have not configured these environment variables, ' +
      'if you are using a configuration file, you may ignore this warning \n';
    logger.warn(environmentCheckerLog);
  }
}

function checkIfConfigurationValuesAreValuesByDefault() {
  var defaultValueCheckerLog = 'The next config variables have been not setted: \n';
  var defaultValueCheckerBool = false;
  for (var key in config) {
    if (config.hasOwnProperty(key)) {
      if (isByDefaultConfigValue(key)) {
        defaultValueCheckerLog = defaultValueCheckerLog + '   * ' + key + ' \n';
        defaultValueCheckerBool = true;
      }
    }
  }
  if (defaultValueCheckerBool) {
    defaultValueCheckerLog = defaultValueCheckerLog +
      'This can lead to a configuration problem, please create a configuration file or pass the environment variables. \n';
    logger.error(defaultValueCheckerLog);
  }
}

function checkConfig() {
  checkIfEnvironmentVariablesArePresent();
  checkIfConfigurationValuesAreValuesByDefault();

}

module.exports = {
  checkConfig: checkConfig
};