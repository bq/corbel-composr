'use strict'

var connection = require('../connectors/corbel')
var ComposrError = require('../ComposrError')
var logger = require('../../utils/composrLogger')
var config = require('config')
var corbel = require('corbel-js')
var redisConnector = require('../connectors/redis')
var timeParser = require('parse-duration')
var yn = require('yn')
// Sign Request configuration
var _duration = config.get('signRequests.duration')
var _durationInMilliseconds = timeParser(_duration)
var signRequestsActive = yn(config.get('signRequests.active'))

/**
 * Auth user middleware
 */
module.exports.authUser = function () {
  return function authUser (req, res, next) {
    var authHeader = req.header('Authorization') || ''
    var token = authHeader.replace('Bearer ', '')

    if (!token) {
      logger.debug('[CorbelAuthHook]', 'Missing token')
      return next(new ComposrError('error:unauthorized', 'Authorization missing', 401))
    }

    try {
      var jwtDecoded = corbel.jwt.decode(token)

      if (jwtDecoded.userId) {
        req.userId = jwtDecoded.userId
        var _key = 'req_signature-' + jwtDecoded.userId
        /**
         * Signing Composr API Requests
         */
        if (signRequestsActive) {
          logger.debug('[CorbelAuthHook]', 'Storing request in redis...')
          redisConnector.set(_key, token, _durationInMilliseconds)
        }

        logger.debug('[CorbelAuthHook]', 'Valid user token, continuing...')
        return next()
      } else {
        logger.debug('[CorbelAuthHook]', 'Not a user token')
        return next(new ComposrError('unauthorized:token', 'Only users can perform this action', 401))
      }
    } catch (e) {
      logger.debug('[CorbelAuthHook]', 'Malformed user token')
      return next(new ComposrError('error:malformed:token', 'Your token is malformed', 400))
    }
  }
}

/**
 * Auth client middleware
 */
module.exports.authClient = function () {
  return function authClient (req, res, next) {
    var authHeader = req.header('Authorization') || ''
    var token = authHeader.replace('Bearer ', '')

    if (!token) {
      logger.debug('[CorbelAuthHook]', 'Missing token')
      return next(new ComposrError('error:unauthorized', 'Authorization missing', 401))
    }

    try {
      corbel.jwt.decode(token)
      logger.debug('[CorbelAuthHook]', 'Valid client or user token, continuing...')
      return next()
    } catch (e) {
      logger.debug('[CorbelAuthHook]', 'Malformed client token')
      return next(new ComposrError('error:malformed:token', 'Your token is malformed', 400))
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
