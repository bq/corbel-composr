'use strict'
var ComposrError = require('../ComposrError')
// TODO: Maybe we can find better packages than these
var validateRaml = require('raml-validate')()
var sanitizeRaml = require('raml-sanitize')()
var validateSchema = require('jsonschema').validate
// raml-validate does not accept empty type (why?), so we add it ourselves
validateRaml.TYPES[undefined] = function (value) {
  return true
}
sanitizeRaml.TYPES[undefined] = function (value) {
  return value
}

module.exports = function (methodDoc) {
  return function (req, res, next) {
    // TODO: We don't validate uriParameters for now, since they are outside the methodDoc
    return validateQueryParams(methodDoc.queryParameters, req.query)
      .then(function () {
        return validateBody(bodySchema(methodDoc), req.body)
      })
      .then(next)
      .catch(next)
  }
}

function bodySchema (methodDoc) {
  // TODO: We only support json by now
  if (methodDoc.body && methodDoc.body['application/json'] && methodDoc.body['application/json'].schema) {
    try {
      return JSON.parse(methodDoc.body['application/json'].schema)
    } catch (e) {
      throw new ComposrError('error:schema:validation', 'wrong schema', 500)
    }
  }
}

function validateQueryParams (schema, items) {
  if (schema && items) {
    // We need sanitize to convert request strings to raml types
    var sanitizeItems = sanitizeRaml(schema)
    var validateItems = validateRaml(schema)
    var result = validateItems(sanitizeItems(items))
    if (!result.valid) {
      var message = result.errors.map(function (error) {
        var attribute = error.attr ? ' ' + error.attr : ''
        return 'Invalid ' + error.key + ': ' + error.rule + attribute
      })
      return Promise.reject(new ComposrError('error:phrase:validation', message, 400))
    }
  }
  return Promise.resolve()
}

function validateBody (schema, items) {
  if (schema && items) {
    var result = validateSchema(items, schema)
    if (result.errors && result.errors.length > 0) {
      var message = result.errors.map(function (error) {
        return error.stack
      })
      return Promise.reject(new ComposrError('error:phrase:validation', message, 400))
    }
  }
  return Promise.resolve()
}
