'use strict'

var redis = require('node-redis')
var config = require('config')

var client = redis.createClient(config.get('redis.port'), config.get('redis.host'), config.get('redis.auth'))

function checkState () {
  return new Promise(function (resolve, reject) {
    client.ping(function (error) {
      if (error) {
        reject()
      } else {
        resolve()
      }
    })
  })
}

module.exports = {
  client: client,
  checkState: checkState
}
