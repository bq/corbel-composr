'use strict'

var request = require('supertest')

/*
* @param  {server} Server where execute the request
* @param  {String} Patch where execute the method
* @param  {String} Method to execute (post, put)
* @param  {Integer} Status code expected
* @param  [String] Fields to be set in the request
* @param  [String] Values to be set in the request
 * @return {promise}
 */
function makeRequest (server, method, path, data, statusCode, fields, values) {
  return new Promise(function (resolve, reject) {
    var req = request(server.app)
    ;[method](path)

    if (fields && values) {
      setFieldsAndValuesToRequest(req, fields, values)
    }

    req.send(data)
      .expect(statusCode)
      .end(function (err, response) {
        if (err) {
          reject(err)
        } else {
          resolve(response)
        }
      })
  })
}

function setFieldsAndValuesToRequest (req, fields, values) {
  values.forEach(function (value, index) {
    req = req.set(fields[index], value)
  })
  return req
}

module.exports = {
  makeRequest: makeRequest
}
