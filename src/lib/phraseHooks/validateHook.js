'use strict'
var ComposrError = require('../ComposrError')
// TODO: Maybe we can find better packages than these
var validate = require('raml-validate')()
var sanitize = require('raml-sanitize')()
// raml-validate does not accept empty type (why?), so we add it ourselves
validate.TYPES[undefined] = function (value) {
  return true
}
sanitize.TYPES[undefined] = function (value) {
  return value
}

module.exports = function (methodDoc) {
  return function (req, res, next) {
    // TODO: We don't validate uriParameters for now, since they are outside the methodDoc
    return validateBlock(methodDoc.queryParameters, req.query)
      .then(function () {
        return validateBlock(bodySchema(methodDoc), req.body)
      })
      .then(next)
      .catch(next)
  }
}

function bodySchema (methodDoc) {
  // TODO: We only support json by now
  if (methodDoc.body && methodDoc.body['application/json'] && methodDoc.body['application/json'].schema) {
    try {
      return JSON.parse(methodDoc.body['application/json'].schema).properties
    } catch (e) {
      throw new ComposrError('error:schema:validation', 'wrong schema', 500)
    }
  }
}

function validateBlock (schema, items) {
  if (schema && items) {
    // We need sanitize to convert request strings to raml types
    var sanitizeItems = sanitize(schema)
    var validateItems = validate(schema)
    var result = validateItems(sanitizeItems(items))
    if (!result.valid) {
      var message = []
      result.errors.forEach(function (error) {
        var attribute = error.attr ? ' ' + error.attr : ''
        message.push('Invalid ' + error.key + ': ' + error.rule + attribute)
      })
      return Promise.reject(new ComposrError('error:phrase:validation', message, 400))
    }
  }
  return Promise.resolve()
}
