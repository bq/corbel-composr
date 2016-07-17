'use strict'

var redisConnector = require('../connectors/redis')
var logger = require('../../utils/composrLogger')
var corbel = require('corbel-js')

function add (path, verb, authorization, data, cacheType) {
  if (authorization) {
    var decoded = corbel.jwt.decode(authorization.replace('Bearer ', ''))
    console.log(decoded)
  }
  var key = verb + '-' + path // TODO add user id or client id
  var expires = Date.now() + 100000

  redisConnector.set(key, {
    expires: expires,
    value: data
  })
}

function get (path, verb, authorization) {
  var date = Date.now()
  var key = verb + '-' + path // TODO ADD auth id
  logger.debug('Fetching item from cache', key)

  return redisConnector.get(key)
    .then(function (item) {
      if (item && item.expires < date) {
        logger.debug('Item found', key, item.value.status)
        return item.value
      } else if (item) {
        logger.debug('Item has expired', key)
        invalidate(key)
      }
      return null
    })
    .catch(function (err) {
      logger.error('Error accesing cache', err)
      return null
    })
}

function list () {
  // TODO
}

function remove (path, verb, authorization, cacheType) {
  var key = verb + '-' + path
  invalidate(key)
}

function invalidate (key) {
  logger.debug('removing from cache', key)
  redisConnector.del(key)
}

module.exports = {
  get: get,
  list: list,
  add: add,
  remove: remove
}
