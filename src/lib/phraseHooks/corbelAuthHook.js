'use strict'

var connection = require('../connectors/corbel')
var ComposrError = require('../ComposrError')
var logger = require('../../utils/composrLogger')
var config = require('config')
var corbel = require('corbel-js')
var redisConnector = require('../connectors/redis')
var timeParser = require('parse-duration')
// Days to seconds
var _duration = config.get('signRequests.durationInDays')
var _durationInSeconds = parseInt(_duration) * 60 * 60 * 24

/**
 * Auth user middleware
 */
module.exports.authUser = function () {
  return function authUser (req, res, next) {
    var authHeader = req.header('Authorization')

    if (!authHeader || !authHeader.replace('Bearer ', '')) {
      return next(new ComposrError('error:authorization:undefined', '', 401))
    }

    try {
      var jwtDecoded = corbel.jwt.decode(authHeader.replace('Bearer ', ''))
      var userId = jwtDecoded.userId
      var accessToken = authHeader.replace('Bearer ', '')
      if (userId) {
        req.userId = userId
        var _key = 'req_signature-' + userId
        /**
         * Signing Composr API Requests
         */
        if (config.get('signRequests.active'){
          redisConnector.set(_key, accessToken, _durationInSeconds)
        }

        return next()
      } else {
        return next(new ComposrError('unauthorized_token', 'Only users can perform this action', 401))
      }
    } catch (e) {
      return next(new ComposrError('error:jwt:malformed', 'Your JWT is malformed', 400))
    }
  }
}

/**
 * Auth client middleware
 */
module.exports.authClient = function () {
  return function authClient (req, res, next) {
    var authHeader = req.header('Authorization')

    if (!authHeader || !authHeader.replace('Bearer ', '')) {
      return next(new ComposrError('error:authorization:undefined', '', 401))
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
module.exports.corbelDriverSetup = function () {
  return function corbelDriverSetup (req, res, next) {
    var authorization = req.headers.authorization

    var corbelDriver = connection.getTokenDriver(authorization, true)
    if (config.get('composrLog.logLevel') === 'debug') {
      corbelDriver.on('request', function () {
        logger.debug('[CorbelAuthHook]', '>>> corbelDriver request: ', arguments)
      })
    }

    req.corbelDriver = corbelDriver

    return next()
  }
}
