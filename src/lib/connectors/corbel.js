'use strict'

var corbel = require('corbel-js')
var config = require('config')
var _ = require('lodash')
var ComposrError = require('../ComposrError')
var logger = require('../../utils/composrLogger')
var https = require('https')

var PHRASES_COLLECTION = 'composr:Phrase'
var SNIPPETS_COLLECTION = 'composr:Snippet'

var corbelConfig = config.get('corbel.options')
corbelConfig = _.extend(corbelConfig, config.get('corbel.credentials'))

var extractDomain = function (accessToken) {
  try {
    var decoded = corbel.jwt.decode(accessToken.replace('Bearer ', ''))
    return decoded.domainId
  } catch (e) {
    logger.error('error:invalid:token', accessToken)
    return null
  }
}

var getTokenDriver = function (accessToken, emptyIfNotAuth) {
  if (!accessToken && !emptyIfNotAuth) {
    throw new ComposrError('error:connection:undefined:accessToken')
  } else if (accessToken) {
    var iamToken = {
      'accessToken': accessToken.replace('Bearer ', '')
    }

    var corbelConfig = {
      urlBase: config.get('corbel.options.urlBase')
    }

    corbelConfig.iamToken = iamToken
    corbelConfig.domain = extractDomain(accessToken)

    return corbel.getDriver(corbelConfig)
  } else {
    return corbel.getDriver({
      urlBase: config.get('corbel.options.urlBase'),
      iamToken: ''
    })
  }
}

function checkState (timeout) {
  var modules = ['iam', 'resources', 'assets', 'evci']
  var path = config.get('corbel.options.urlBase')

  var result = {}

  var promises = modules.map(function (module) {
    return new Promise(function (resolve) {
      // Remove the version (v1.0) from the urlBase and add '/version'
      var versionPath = path.replace(new RegExp('(.*/)[^/]+/?$'), '$1')
          .replace('{{module}}', module) + '/version'

      logger.info('Checking for external service', module, ': ', versionPath)

      var request = https.get(versionPath, function (res) {
        result[module] = Math.floor(res.statusCode / 100) === 2
        resolve()
      })
        .on('error', function () {
          result[module] = false
          resolve()
        })

      if (timeout) {
        setTimeout(function () {
          request.abort()
        }, timeout)
      }
    })
  })

  return Promise.all(promises)
    .then(function () {
      return result
    })
}

function waitUntilCorbelIsReady () {
  var retries = config.get('services.retries')
  var requestTimeout = config.get('services.timeout')

  return _waitUntilCorbelModulesReady(retries, requestTimeout)
}

function bouncePromise (fn, time) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      fn().then(resolve)
        .catch(reject)
    }, time)
  })
}

function _waitUntilCorbelModulesReady (retries, requestTimeout) {
  var retryTime = config.get('services.time') * retries

  if (!retries) {
    logger.error(' :( - Connection to corbel can not be completed')
    return Promise.reject()
  }

  return checkState(requestTimeout)
    .then(function (results) {
      var allRunning = Object.keys(results).reduce(function (prev, module) {
        var isUp = results[module]
        var state = isUp ? 'is UP' : 'is DOWN'
        logger.info('>>> Module', module, state)

        return prev && isUp
      }, true)

      if (allRunning) {
        logger.info('All services up and running!')
        return true
      } else {
        logger.info('Retrying services check after', retryTime, 'milliseconds')
        return bouncePromise(function () {
          return _waitUntilCorbelModulesReady(retries - 1, requestTimeout)
        }, retryTime)
      }
    })
}

module.exports.SNIPPETS_COLLECTION = SNIPPETS_COLLECTION
module.exports.PHRASES_COLLECTION = PHRASES_COLLECTION
module.exports.extractDomain = extractDomain
module.exports.getTokenDriver = getTokenDriver
module.exports.checkState = checkState
module.exports.waitUntilCorbelIsReady = waitUntilCorbelIsReady
module.exports._waitUntilCorbelModulesReady = _waitUntilCorbelModulesReady
