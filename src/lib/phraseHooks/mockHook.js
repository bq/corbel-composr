'use strict'
// TODO: Only support for v4 schema!
var mocker = require('json-schema-faker')
var _ = require('lodash')

module.exports = function (phraseModel, verb) {
  var methodDoc = phraseModel.getDoc(verb)

  return function (req, res, next) {
    if (methodDoc && methodDoc.responses) {
      // Use the header if present
      var status = req.headers['Mock-Response-Status']
      if (!status) {
        // Find the first 2xx specification otherwise
        status = _.find(Object.keys(methodDoc.responses), function (httpCode) {
          return httpCode.startsWith('2')
        })
      }

      // TODO: We only support json by now
      var jsonBody = status && methodDoc.responses[status] &&
      methodDoc.responses[status].body && methodDoc.responses[status].body['application/json']
        ? methodDoc.responses[status].body['application/json'] : null

      try {
        if (jsonBody && jsonBody.schema) {
          res.send(parseInt(status, 10), mocker(JSON.parse(jsonBody.schema)))
        }
        if (jsonBody && jsonBody.example) {
          res.send(parseInt(status, 10), JSON.parse(jsonBody.example))
        }
      } catch (e) {
        return next(e)
      }
    }
    return next()
  }
}
