'use strict'

var redisConnector = require('../connectors/redis')
var logger = require('../../utils/composrLogger')
var corbel = require('corbel-js')
var timeParser = require('parse-duration')

var DEFAULT_CACHE_DURATION = '1m'
var CLIENT_CACHE_TYPE = 'client'
var USER_CACHE_TYPE = 'user'

function add (path, verb, authorization, version, data, options) {
  var type = options.type || CLIENT_CACHE_TYPE
  var key = getKey(path, verb, authorization, version, type)
  var duration = options.duration || DEFAULT_CACHE_DURATION
  var msDuration = timeParser(duration)

  logger.debug('[Cache]', 'Adding item to', type, 'cache', key, 'with a duration of: ', msDuration, '(ms)')

  redisConnector.set(key, {
    duration: msDuration,
    created: Date.now(),
    value: data
  }, msDuration)
}

function get (path, verb, authorization, version, options) {
  var type = options.type || CLIENT_CACHE_TYPE
  var key = getKey(path, verb, authorization, version, type)
  logger.debug('[Cache]', 'Fetching item from cache', key)

  return redisConnector.get(key)
    .then(function (item) {
      if (item) {
        logger.debug('[Cache]', 'Item found', key, item.value.status)
        return item.value
      }
      return null
    })
    .catch(function (err) {
      logger.error('[Cache]', 'Error accesing cache', err)
      return null
    })
}

function getKey (path, verb, authorization, version, type) {
  var identifier = getIdentifier(authorization, type)

  // Sanitize the path, so everyone starts with '/'
  if (path.substr(0, 1) !== '/') {
    path = '/' + path
  }

  return identifier + '-' + version + '-' + verb + '-' + path
}

function getIdentifier (authorization, type) {
  var identifier = 'no-token'
  var authorizationSanitized = authorization ? authorization.replace('Bearer ', '') : ''

  if (authorizationSanitized) {
    try {
      var decoded = corbel.jwt.decode(authorizationSanitized)
      if (decoded.userId && type === USER_CACHE_TYPE) {
        identifier = decoded.userId
      } else if (decoded.clientId) {
        identifier = decoded.clientId
      }
    } catch (e) {
      logger.debug('[Cache]', 'Unable to parse authorization header', e)
    }
  }

  return identifier
}

function remove (path, verb, authorization, version, domain, options) {
  var key = getKey(path, verb, authorization, version)

  if (options && options.invalidate) {
    options.invalidate.forEach(function (url) {
      url = domain + '/' + url + '*'
      // Adding the domain is mandatory since urls in the phrase model doesnt know about the domain
      var keyWithPattern = getKey(url, verb, authorization, version)
      invalidateWildcard(keyWithPattern)
    })
  }

  invalidate(key)
}

function invalidate (key) {
  logger.debug('[Cache]', 'removing from cache', key)
  redisConnector.del(key)
}

function invalidateWildcard (key) {
  logger.debug('[Cache]', 'removing from cache wildcard', key)
  redisConnector.delWildcard(key)
}

module.exports = {
  get: get,
  add: add,
  remove: remove,
  getKey: getKey
}
