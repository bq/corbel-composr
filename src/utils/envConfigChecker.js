'use strict'

var logger = require('./composrLogger')
var _ = require('lodash')
var config = require('config')

var variableNames = [
  'CREDENTIALS_CLIENT_ID',
  'CREDENTIALS_SCOPES',
  'CREDENTIALS_CLIENT_SECRET',
  'URL_BASE'
]

var mandatoryVariables = [
  'corbel.credentials.clientId',
  'corbel.credentials.clientSecret',
  'corbel.credentials.scopes',
  'corbel.options.urlBase'
]

function isUndefinedConfigValue (val) {
  return typeof (val) === 'undefined' || val === "''"
}

function environmentVariableIsNotDefined (varName) {
  return isUndefinedConfigValue(process.env[varName])
}

function getMissingEnvVariables () {
  return _.compact(variableNames.map(function (varName) {
    if (environmentVariableIsNotDefined(varName)) {
      return varName
    }
  }))
}

function getEmptyMandatoryValues () {
  return _.compact(mandatoryVariables.map(function (key) {
    if (!config.has(key) || !config.get(key)) {
      return key
    }
  }))
}

function logMissingVariablesMessage (variables) {
  var logMessage = 'The next environment variables are not present: \n'

  variables.forEach(function (varName) {
    logMessage += '   * ' + varName + '\n'
  })

  logMessage += 'Looks that you have not configured these environment variables, ' +
    'if you are using a configuration file, you may ignore this warning \n'

  logger.warn('[Config Checker]', logMessage)
}

function logNotFilledValuesMessage (variables) {
  var logMessage = 'The next config variables have been not setted: \n'

  variables.forEach(function (varName) {
    logMessage += '   * ' + varName + '\n'
  })

  logMessage += 'This can lead to a configuration problem, please create a configuration file or pass the environment variables. \n'

  logger.error('[Config Checker]', logMessage)
}

function checkConfig () {
  var missingEnvVariables = getMissingEnvVariables()

  if (missingEnvVariables.length > 0) {
    logMissingVariablesMessage(missingEnvVariables)
  }

  var notFilledMandatoryValues = getEmptyMandatoryValues()

  if (notFilledMandatoryValues.length > 0) {
    logNotFilledValuesMessage(notFilledMandatoryValues)
  }
}

module.exports = {
  checkConfig: checkConfig
}
