'use strict'

var redisConnector = require('../connectors/redis')
var logger = require('../../utils/composrLogger')
var corbel = require('corbel-js')

function add (data, path, authorization, cacheType, verb) {
  console.log('adding to cache', path, data)
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

function get (verb, path, authorization) {
  var date = Date.now()
  var key = verb + '-' + path // TODO ADD auth id
  logger.debug('Fetching item from cache', key)

  return redisConnector.get(key)
    .then(function (item) {
      console.log(item)
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

function remove (path, authorization) {
  console.log('removing from cache', path)
// redisConnector.del(key)
}

function invalidate (key) {
}

module.exports = {
  get: get,
  list: list,
  add: add,
  remove: remove
}
