'use strict'

var _ = require('lodash')
var fs = require('fs')
var uuid = require('uuid')
var ComposrError = require('./ComposrError')

function getDefaultConfig () {
  return _.cloneDeep(require('../config/config.json'))
}

function getConfigFromFile (environment) {
  var environmentFileConfig = environment + '.json'
  var configuration = {}

  try {
    var fstat = fs.statSync(__dirname + '/../config/' + environmentFileConfig)
    if (fstat.isFile()) {
      configuration = require('../config/' + environmentFileConfig)
    }
  } catch (e) {
    console.log('warn:config:' + environment + ':undefined')
  }

  return configuration
}

function isDefinedConfigValue (val) {
  return typeof (val) !== 'undefined' && val !== "''"
}

function getInitialConfig () {
  var env = process.env.NODE_ENV || 'development'
  var environmentFileConfig = getConfigFromFile(env)
  var defaultConfig = getDefaultConfig()
  var config = _.defaults(environmentFileConfig, defaultConfig)

  // Finally if it exists on the environment, use this
  if (isDefinedConfigValue(process.env.COMPOSR_CONFIG)) {
    console.log('warn:config: DEPRECATED ENVIRONMENT VARIABLE COMPOSR_CONFIG')

    try {
      var envConfig = typeof (process.env.COMPOSR_CONFIG) === 'object' ? process.env.COMPOSR_CONFIG : JSON.parse(process.env.COMPOSR_CONFIG)
      config = _.defaults(envConfig, config)
    } catch (e) {
      console.log(e)
      console.log('warn:config:badformatedConfig' + env + ':undefined', process.env.COMPOSR_CONFIG)
    }
  }

  // store environment variable
  config.env = env

  // Server UUID
  config.serverID = uuid.v1()

  return config
}

var initialConfig = getInitialConfig()

if (isDefinedConfigValue(process.env.SERVER_NAME)) {
  initialConfig.serverName = process.env.SERVER_NAME
}

if (isDefinedConfigValue(process.env.CREDENTIALS_CLIENT_ID)) {
  initialConfig['corbel.composr.credentials'].clientId = process.env.CREDENTIALS_CLIENT_ID
}

if (isDefinedConfigValue(process.env.CREDENTIALS_CLIENT_SECRET)) {
  initialConfig['corbel.composr.credentials'].clientSecret = process.env.CREDENTIALS_CLIENT_SECRET
}

if (isDefinedConfigValue(process.env.CREDENTIALS_SCOPES)) {
  initialConfig['corbel.composr.credentials'].scopes = process.env.CREDENTIALS_SCOPES
}

if (isDefinedConfigValue(process.env.URL_BASE)) {
  initialConfig['corbel.driver.options'].urlBase = process.env.URL_BASE
}

if (isDefinedConfigValue(process.env.ACCESS_LOG)) {
  initialConfig['composrLog.accessLog'] = JSON.parse(process.env.ACCESS_LOG)
}

if (isDefinedConfigValue(process.env.PORT)) {
  initialConfig.port = parseInt(process.env.PORT, 10)
}

if (isDefinedConfigValue(process.env.ACCESS_LOG_FILE)) {
  var accesLogFile = process.env.ACCESS_LOG_FILE === 'false' ? '' : process.env.ACCESS_LOG_FILE
  initialConfig['composrLog.accessLogFile'] = accesLogFile
}

if (isDefinedConfigValue(process.env.LOG_FILE)) {
  var logFile = process.env.LOG_FILE === 'false' ? '' : process.env.LOG_FILE
  initialConfig['composrLog.logFile'] = logFile
}

if (isDefinedConfigValue(process.env.LOG_LEVEL)) {
  initialConfig['composrLog.logLevel'] = process.env.LOG_LEVEL
}

if (isDefinedConfigValue(process.env.SYSLOG)) {
  initialConfig['composrLog.syslog'] = JSON.parse(process.env.SYSLOG)
}

if (isDefinedConfigValue(process.env.BUNYAN_LOG)) {
  initialConfig['bunyan.log'] = JSON.parse(process.env.BUNYAN_LOG)
}

if (isDefinedConfigValue(process.env.BUNYAN_STDOUT)) {
  initialConfig['bunyan.stdout'] = JSON.parse(process.env.BUNYAN_STDOUT)
}

if (isDefinedConfigValue(process.env.BUNYAN_SYSLOG)) {
  initialConfig['bunyan.syslog'] = JSON.parse(process.env.BUNYAN_SYSLOG)
}

if (isDefinedConfigValue(process.env.BUNYAN_STREAM_SERVER)) {
  initialConfig['bunyan.streamServer'] = process.env.BUNYAN_STREAM_SERVER
}

if (isDefinedConfigValue(process.env.RABBITMQ_HOST)) {
  initialConfig['rabbitmq.host'] = process.env.RABBITMQ_HOST
}

if (isDefinedConfigValue(process.env.RABBITMQ_PORT)) {
  initialConfig['rabbitmq.port'] = process.env.RABBITMQ_PORT
}

if (isDefinedConfigValue(process.env.RABBITMQ_USERNAME)) {
  initialConfig['rabbitmq.username'] = process.env.RABBITMQ_USERNAME
}

if (isDefinedConfigValue(process.env.RABBITMQ_PASSWORD)) {
  initialConfig['rabbitmq.password'] = process.env.RABBITMQ_PASSWORD
}

if (isDefinedConfigValue(process.env.RABBITMQ_FORCE_CONNECT)) {
  initialConfig['rabbitmq.forceconnect'] = JSON.parse(process.env.RABBITMQ_FORCE_CONNECT)
}

if (isDefinedConfigValue(process.env.RABBITMQ_HEARTBEAT)) {
  initialConfig['rabbitmq.heartbeat'] = parseInt(process.env.RABBITMQ_HEARTBEAT, 10)
}

if (isDefinedConfigValue(process.env.KEYMETRICS)) {
  initialConfig.keymetrics = JSON.parse(process.env.KEYMETRICS)
}

if (isDefinedConfigValue(process.env.NRACTIVE)) {
  initialConfig.newrelic = JSON.parse(process.env.NRACTIVE)
}

if (isDefinedConfigValue(process.env.NRAPPNAME)) {
  initialConfig['newrelic.name'] = process.env.NRAPPNAME
}

if (isDefinedConfigValue(process.env.NRAPIKEY)) {
  initialConfig['newrelic.key'] = process.env.NRAPIKEY
}

if (isDefinedConfigValue(process.env.SERVICES_TIMEOUT)) {
  initialConfig['services.timeout'] = process.env.SERVICES_TIMEOUT
}

if (isDefinedConfigValue(process.env.SERVICES_RETRIES)) {
  initialConfig['services.retries'] = process.env.SERVICES_RETRIES
}

if (isDefinedConfigValue(process.env.SERVICES_TIME)) {
  initialConfig['services.time'] = process.env.SERVICES_TIME
}
// Set composr-core execution phrases with Node VM
if (isDefinedConfigValue(process.env.EXEC_WITH_VM)) {
  initialConfig['execution.vm'] = JSON.parse(process.env.EXEC_WITH_VM) || false
}
// Enforce run Garbage Collector every phrase execution
if (isDefinedConfigValue(process.env.ENFORCE_GC)) {
  initialConfig['execution.gc'] = JSON.parse(process.env.ENFORCE_GC)
}

// Sanitize BASE_URL forcing to always end with '/'
var lastCharUrlBase = initialConfig['corbel.driver.options'].urlBase.split('').pop()

if (lastCharUrlBase !== '/') {
  initialConfig['corbel.driver.options'].urlBase = initialConfig['corbel.driver.options'].urlBase + '/'
}

module.exports = function (key, haltOnUndefined) {
  if (!key) {
    return _.cloneDeep(initialConfig)
  } else if (typeof (initialConfig[key]) === 'undefined' && haltOnUndefined) {
    throw new ComposrError('error:composr:config:undefined', '', 500)
  } else {
    return _.cloneDeep(initialConfig[key])
  }
}
