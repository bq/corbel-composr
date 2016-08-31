'use strict'

var ComposrError = require('composr-core').ComposrError
var logger = require('../../utils/composrLogger')
var tokenVerifier = require('corbel-token-verifier')

/**
 * Token Object Middleware
 */
module.exports = function () {
  return function tokenObjectHook (req, res, next) {
    var authHeader = req.header('Authorization') || ''
    var tokenObject = tokenVerifier(authHeader)

    if (authHeader && !tokenObject) {
      logger.debug('[CorbelAuthHook]', 'Malformed user token')
      return next(new ComposrError('error:malformed:token', 'Your token is malformed', 400))
    } else if (!tokenObject) {
      logger.debug('[CorbelAuthHook]', 'Request without token')
    } else {
      logger.debug('[CorbelAuthHook]', 'Request with token')
      req.tokenObject = tokenObject
    }

    return next()
  }
}
