'use strict'
// var redisConnector = require('../connectors/redis')
var ComposrError = require('../ComposrError')
// var logger = require('../../utils/composrLogger')
// var config = require('config')
// var corbel = require('corbel-js')

module.exports.redisCache = function () {
  return function (req, res, next) {
    var authHeader = req.header('Authorization')

    console.log(authHeader)

    var path = req.getHref()

    console.log(path)

    return next(new ComposrError('unauthorized_token', 'Only users can perform this action', 401))
  }
}
