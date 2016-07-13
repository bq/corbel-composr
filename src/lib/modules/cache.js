'use strict'

var redisConnector = require('../connectors/redis')
var logger = require('../../utils/composrLogger')

function set (key, expires, value) {
  redisConnector.set(key, {
    expires: expires,
    value: value
  })
}

function get (key) {
  var date = Date.now()
  logger.debug('Fetching item from cache', key)

  return redisConnector.get(key)
    .then(function (item) {
      if (item && item.expires < date) {
        logger.debug('Item found', key)
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

function invalidate (key) {
  redisConnector.del(key)
}

module.exports = {
  set: set,
  get: get,
  list: list,
  invalidate: invalidate
}
