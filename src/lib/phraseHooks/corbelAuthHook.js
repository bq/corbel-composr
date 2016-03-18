'use strict'
var connection = require('../corbelConnection')
var ComposrError = require('../ComposrError')
var logger = require('../../utils/composrLogger')
var config = require('../config')
var corbel = require('corbel-js')

module.exports.authUser = function (methodDoc) {
  return function (req, res, next) {
    var authHeader = req.header('Authorization')

    if (!authHeader || !authHeader.replace('Bearer ', '')) {
      throw new ComposrError('error:authorization:undefined', '', 401)
    }

    var userId
    try {
      var jwtDecoded = corbel.jwt.decode(authHeader.replace('Bearer ', ''))
      userId = jwtDecoded.userId
    } catch (e) {
      next(new ComposrError('error:jwt:malformed', 'Your JWT is malformed', 400))
    }

    userId ? next() : next(new ComposrError('unauthorized_token', 'Only users can perform this action', 401))
  }
}

module.exports.authClient = function (methodDoc) {
  return function (req, res, next) {
    var authHeader = req.header('Authorization')

    if (!authHeader || !authHeader.replace('Bearer ', '')) {
      throw new ComposrError('error:authorization:undefined', '', 401)
    }

    try {
      corbel.jwt.decode(authHeader.replace('Bearer ', ''))
      return next()
    } catch (e) {
      return next(new ComposrError('error:jwt:malformed', 'Your JWT is malformed', 400))
    }
  }
}

/**
 * [logCorbelRequest description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
module.exports.corbelDriverSetup = function (methodDoc) {
  return function (req, res, next) {
    var authorization = req.headers.authorization

    var corbelDriver = connection.getTokenDriver(authorization, true)
    if (config('composrLog.logLevel') === 'debug') {
      corbelDriver.on('request', function () {
        logger.debug('>>> corbelDriver request: ', arguments)
      })
    }

    req.corbelDriver = corbelDriver

    return next()
  }
}
