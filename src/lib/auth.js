'use strict'

var ComposrError = require('composr-core').ComposrError

var getAuth = function (req, res) {
  if (!req) {
    throw new ComposrError('undefined:req', 'Missing request parameter', 422)
  }

  var auth = req.header('Authorization')

  if (!auth) {
    throw new ComposrError('missing:header:authorization', 'Authorization header not found', 401)
  }

  return auth
}

module.exports.getAuth = getAuth
