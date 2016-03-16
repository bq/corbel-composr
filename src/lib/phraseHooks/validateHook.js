'use strict'
var engine = require('../engine')
var ComposrError = require('../ComposrError')
var logger = require('../../utils/composrLogger')
var _ = require('lodash');
var validate = require('raml-validate')();
// raml-validate does not accept empty type (why?), so we add it ourselves
validate.TYPES[undefined] = function (value) {
  return true;
};


module.exports = function (methodDoc) {
  return function (req, res, next) {
    // TODO: skip mediaTypeExtension
    validateBlock(methodDoc.uriParameters, req.params)
      .then(function () {
        return validateBlock(methodDoc.queryParameters, req.query)
      })
      .then(function () {
        return validateBlock(bodySchema(methodDoc), req.body)
      })
      .then(next)
      .catch(next)
  }
}

function bodySchema(methodDoc) {
  // TODO: We only support json by now
  return methodDoc.body && methodDoc.body['application/json'] && methodDoc.body['application/json'].schema ?
    methodDoc.body['application/json'].schema.parameters : null
}

function validateBlock(schema, items) {
  if (schema && items) {
    var validateItems = validate(schema)
    var result = validateItems(items);
    if (!result.valid) {
      var message = []
      result.errors.forEach(function (error) {
        var attribute = error.attr ? ' ' + error.attr : '';
        message.push('Invalid ' + error.key + ': ' + error.rule + attribute);
      })
      return Promise.reject(new ComposrError('error:phrase:validation', message, 400));
    }
  }
  return Promise.resolve();
}