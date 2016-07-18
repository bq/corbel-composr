'use strict'

var redisConnector = require('../connectors/redis')
var logger = require('../../utils/composrLogger')
var corbel = require('corbel-js')
var timeParser = require('parse-duration')
var defaultDuration = '1m'

function add (path, verb, authorization, version, data, options) {
  if (authorization) {
    var decoded = corbel.jwt.decode(authorization.replace('Bearer ', ''))
    console.log(decoded)
  }
  var key = getKey(path, verb, authorization, version)
  var duration = options.duration || defaultDuration
  var msDuration = timeParser(duration)

  logger.debug('[Cache]', 'Adding item to cache', key, 'with a duration of: ', msDuration, '(ms)')

  redisConnector.set(key, {
    duration: duration,
    created: Date.now(),
    value: data
  })
}

function get (path, verb, authorization, version) {
  var date = Date.now()
  var key = getKey(path, verb, authorization, version)
  logger.debug('[Cache]', 'Fetching item from cache', key)

  return redisConnector.get(key)
    .then(function (item) {
      if (item && item.duration + item.created > date) {
        logger.debug('[Cache]', 'Item found', key, item.value.status)
        return item.value
      } else if (item) {
        logger.debug('[Cache]', 'Item has expired with duration:', item.duration, 'current date:', date, key)
        invalidate(key)
      }
      return null
    })
    .catch(function (err) {
      logger.error('[Cache]', 'Error accesing cache', err)
      return null
    })
}

function list () {
  // TODO
}

function getKey (path, verb, auth, version) {
  return verb + '-' + path + '-' + version
}

function remove (path, verb, authorization, version, options) {
  var key = getKey(path, verb, authorization, version)
  invalidate(key)
}

function invalidate (key) {
  logger.debug('[Cache]', 'removing from cache', key)
  redisConnector.del(key)
}

module.exports = {
  get: get,
  list: list,
  add: add,
  remove: remove
}
