'use strict'

var redis = require('redis')
var config = require('config')
var logger = require('../../utils/composrLogger')
var client

function checkState () {
  return new Promise(function (resolve, reject) {
    if (!client) {
      init(function () {
        resolve(false)
      })
    }

    client.ping(function (error) {
      if (error) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

function init (cbError) {
  logger.debug('[Redis client]', 'Creating a new client')

  var redisUrl = config.get('redis.host') + ':' + config.get('redis.port')

  if (config.get('redis.user') && config.get('redis.password')) {
    redisUrl = config.get('redis.user') + ':' + config.get('redis.password') + '@' + redisUrl
  }

  if (config.get('redis.db')) {
    redisUrl = redisUrl + '/' + config.get('redis.db')
  }

  redisUrl = '//' + redisUrl

  client = redis
    .createClient(redisUrl)

  client.on('error', function (e) {
    client.quit()
    client = null
    logger.error('[Redis client]', 'Error connecting to REDIS', e)
    if (cbError) {
      cbError(e)
    }
  })
}

function set (key, value, expireInMs, nx) {
  if (!client) {
    init()
  }
  var data = value
  try {
    data = JSON.stringify(value)
  } catch (e) {}

  (expireInMs) ? client.set(key, data, 'px', expireInMs, redis.print) : client.set(key, data, redis.print)
}

/*
* Only set the key if (not) already set
*/
function setNx (key, value) {
  if (!client) {
    init()
  }
  var data = value
  try {
    data = JSON.stringify(value)
  } catch (e) {}

  client.set(key, data, 'nx', redis.print)
}

function get (key) {
  if (!client) {
    init()
  }

  return new Promise(function (resolve, reject) {
    client.get(key, function (err, val) {
      if (err) {
        return reject(err)
      }

      try {
        var res = val ? JSON.parse(val) : null
        val = res
      } catch (e) {}
      resolve(val) // Vall is null if the key is missing
    })
  })
}

function del (key) {
  if (!client) {
    init()
  }

  client.del(key, function (err) {
    if (err) {
      logger.error('[Redis client]', 'Error deleting item', key, err)
    } else {
      logger.debug('[Redis client]', 'Item deleted', key)
    }
  })
}

/**
 * Removes all keys starting with a willcard
 */
function delWildcard (key, callback) {
  if (!client) {
    init()
  }

  client.keys(key, function (err, rows) {
    for (var i = 0, j = rows.length; i < j; ++i) {
      del(rows[i])
    }

    if (callback) {
      callback(err)
    }
  })
}

module.exports = {
  set: set,
  setNx: setNx,
  get: get,
  del: del,
  delWildcard: delWildcard,
  checkState: checkState
}
