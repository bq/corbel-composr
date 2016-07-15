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
  client = redis
    .createClient(config.get('redis.port'), config.get('redis.host'), null)

  client.on('error', function (e) {
    client.quit()
    client = null
    logger.error('Error connecting to REDIS', e)
    if (cbError) {
      cbError(e)
    }
  })
}

function set (key, value) {
  if (!client) {
    init()
  }
  var data = value
  try {
    data = JSON.stringify(value)
  } catch (e) {}

  client.set(key, data, redis.print)
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

function del () {
}

module.exports = {
  set: set,
  get: get,
  del: del,
  checkState: checkState
}
