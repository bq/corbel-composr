'use strict';

var logger = require('./logger');
var _ = require('lodash');
var config = require('../lib/config');

var variableNames = [
  'CREDENTIALS_CLIENT_ID',
  'CREDENTIALS_SCOPES',
  'CREDENTIALS_CLIENT_SECRET',
  'URL_BASE',
  'RABBITMQ_HOST',
  'RABBITMQ_PORT',
  'RABBITMQ_USERNAME',
  'RABBITMQ_PASSWORD'
];

var mandatoryVariables = [
  'rabbitmq.host',
  'rabbitmq.port',
  'rabbitmq.username',
  'rabbitmq.password',
  'corbel.composr.credentials',
  'corbel.driver.options'
];

function isUndefinedConfigValue(val) {
  return typeof(val) === 'undefined' || val === '\'\'';
}

function environmentVariableIsNotDefined(varName) {
  return isUndefinedConfigValue(process.env[varName]);
}

function getMissingEnvVariables() {
  return _.compact(variableNames.map(function(varName) {
    if (environmentVariableIsNotDefined(varName)) {
      return varName;
    }
  }));
}

function isDefaultValue(defaultValue, configValue) {
  if (typeof(defaultValue) === 'object') {
    return Object.keys(defaultValue).reduce(function(prev, next) {
      return (defaultValue[next] === configValue[next]) && prev;
    }, true);
  } else {
    return defaultValue === configValue;
  }
}

function getEmptyMandatoryValues(defaultValues) {
  return _.compact(mandatoryVariables.map(function(key) {
    if (isDefaultValue(defaultValues[key], config(key))) {
      return key;
    }
  }));
}

function logMissingVariablesMessage(variables) {

  var logMessage = 'The next environment variables are not present: \n';

  variables.forEach(function(varName) {
    logMessage += '   * ' + varName + '\n';
  });

  logMessage += 'Looks that you have not configured these environment variables, ' +
    'if you are using a configuration file, you may ignore this warning \n';

  logger.warn(logMessage);
}

function logNotFilledValuesMessage(variables) {

  var logMessage = 'The next config variables have been not setted: \n';

  variables.forEach(function(varName) {
    logMessage += '   * ' + varName + '\n';
  });

  logMessage += 'This can lead to a configuration problem, please create a configuration file or pass the environment variables. \n';

  logger.error(logMessage);
}


function checkConfig() {
  var missingEnvVariables = getMissingEnvVariables();

  if (missingEnvVariables.length > 0) {
    logMissingVariablesMessage(missingEnvVariables);
  }

  var defaultValues = require('../config/config.json');

  var notFilledMandatoryValues = getEmptyMandatoryValues(defaultValues);

  if (notFilledMandatoryValues.length > 0) {
    logNotFilledValuesMessage(notFilledMandatoryValues);
  }

}

module.exports = {
  checkConfig: checkConfig
};