'use strict'

var corbel = require('corbel-js')
var ComposrError = require('../lib/ComposrError')
var config = require('../lib/config')

function getCorbelErrorBody (corbelErrResponse) {
  var errorBody = typeof (corbelErrResponse.data) !== 'undefined' && typeof (corbelErrResponse.data.body) === 'string' && corbelErrResponse.data.body.indexOf('{') !== -1 ? JSON.parse(corbelErrResponse.data.body) : corbelErrResponse
  return errorBody
}

module.exports = function (server) {
  server.get('/e1', function (res) {
    res.undefinedFunction()
  })

  server.get('/e2', function () {
    throw new ComposrError('error:custom', '', 555)
  })

  server.post('/jwt', function (req, res) {
    req.body = req.body || {}
    req.body.claims.aud = corbel.Iam.AUD

    res.send(200, corbel.jwt.generate(req.body.claims, req.body.secret))
  })

  server.post('/postexecutionhandler', function (req, res, next) {
    req.body = { 'hello': 'world' }
    return next()
  }, function (req, res, e) {
    res.send(200, req.body)
  })

  server.post('/token', function (req, res, next) {
    var data = req.body || {}

    var corbelConfig = config('corbel.driver.options')
    corbelConfig.clientId = data.clientId
    corbelConfig.clientSecret = data.clientSecret
    corbelConfig.scopes = data.scopes

    var corbelDriver = corbel.getDriver(corbelConfig)

    corbelDriver.iam.token().create().then(function (response) {
      res.send(200, response)
    }).catch(function (error) {
      console.log(error)
      var errorBody = getCorbelErrorBody(error)
      next(new ComposrError('error:token', errorBody, error.status))
    })
  })

  server.get('/cache', function (req, res) {
    res.set('Cache-Control', 'public, max-age=31536000')
    res.send(200, {
      data: true
    })
  })
}
