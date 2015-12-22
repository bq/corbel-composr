'use strict'

var validator = require('./validate')
var ComposrError = require('./ComposrError')

var getAuth = function (req, res) {
  validator.isValue(req, 'undefined:req')

  var auth = req.header('Authorization')

  if (!auth) {
    throw new ComposrError('missing:header:authorization', 'Authorization header not found', 401)
  }

  return auth
}

module.exports.getAuth = getAuth
