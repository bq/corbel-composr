'use strict'

var redisConnector = require('../connectors/redis')
var logger = require('../../utils/composrLogger')

function add (data, path, authorization) {
  console.log('adding to cache', path)
/* redisConnector.set(key, {
  expires: expires,
  value: value
})*/
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
