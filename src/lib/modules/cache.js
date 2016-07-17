'use strict'

var redisConnector = require('../connectors/redis')
var logger = require('../../utils/composrLogger')
var corbel = require('corbel-js')

function add (path, verb, authorization, version, data, cacheType) {
  if (authorization) {
    var decoded = corbel.jwt.decode(authorization.replace('Bearer ', ''))
    console.log(decoded)
  }
  var key = getKey(path, verb, authorization, version)
  var expires = Date.now() + 10000

  logger.debug('[Cache]', 'Adding item to cache', key, 'with exp: ', expires)

  redisConnector.set(key, {
    expires: expires,
    value: data
  })
}

function get (path, verb, authorization, version) {
  var date = Date.now()
  var key = getKey(path, verb, authorization, version)
  logger.debug('[Cache]', 'Fetching item from cache', key)

  return redisConnector.get(key)
    .then(function (item) {
      if (item && item.expires > date) {
        logger.debug('[Cache]', 'Item found', key, item.value.status)
        return item.value
      } else if (item) {
        logger.debug('[Cache]', 'Item has expired with exp:', item.expires, 'current date:', date, key)
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

function remove (path, verb, authorization, version, cacheType) {
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
