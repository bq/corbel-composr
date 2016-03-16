'use strict'
var engine = require('../engine')
var ComposrError = require('../ComposrError')
var logger = require('../../utils/composrLogger')
var _ = require('lodash');
var mocker = require('json-schema-faker');

module.exports = function (methodDoc) {

  return function (req, res, next) {
    if (methodDoc.responses) {

      // Use the header if present
      var status = req.headers['mock-response-status'];
      if (!status) {
        // Find the first 2xx specification otherwise
        status = _.find(Object.keys(methodDoc.responses), function (httpCode) {
          return httpCode.startsWith('2');
        });
      }

      // TODO: We only support json by now
      var jsonBody = status && methodDoc.responses[status] &&
      methodDoc.responses[status].body && methodDoc.responses[status].body['application/json'] ?
        methodDoc.responses[status].body['application/json'] : null;

      // TODO: catch parseInt and parse errors
      // TODO: Only support for v4 schema!
      if (jsonBody && jsonBody.schema) {
        res.send(parseInt(status), mocker(JSON.parse(jsonBody.schema)));
      }
      if (jsonBody && jsonBody.example) {
        res.send(parseInt(status), JSON.parse(jsonBody.example));
      }

    }
  }

}
