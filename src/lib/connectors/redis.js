'use strict'

var redis = require('redis')
var config = require('config')
var logger = require('../../utils/composrLogger')
var client

function checkState () {
  return new Promise(function (resolve, reject) {
    if (!client) {
      init(function (err) {
        logger.error('Error connecting to REDIS', err)
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
  client = redis
    .createClient(config.get('redis.port'), config.get('redis.host'), null)

  client.on('error', function (e) {
    client.quit()
    client = null
    cbError(e)
  })
}

function set (key, value) {
  client.set(key, value, redis.print)
}

function get (key) {
  return new Promise(function (resolve, reject) {
    client.get(key, function (err, val) {
      if (err) {
        return reject(err)
      }
      resolve(val) // Vall is null if the key is missing
    })
  })
}

function del () {
}

module.exports = {
  set: set,
  get: get,
  del: del,
  checkState: checkState
}
