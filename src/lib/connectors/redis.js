'use strict'

var redis = require('node-redis')
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
    cbError(e)
  })
}

module.exports = {
  client: client,
  checkState: checkState
}
