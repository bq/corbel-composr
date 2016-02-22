'use strict'

var connection = require('../lib/corbelConnection')
var engine = require('../lib/engine')
var ComposrError = require('../lib/ComposrError')
var logger = require('../utils/composrLogger')
var auth = require('../lib/auth')

function createOrUpdateVirtualDomain (req, res) {
  var authorization = auth.getAuth(req, res)
  var clientCorbelDriver = connection.getTokenDriver(authorization)

  var virtualDomain = req.body || {}

  checkIfClientCanPublish(clientCorbelDriver, res)
    .then(function () {
      return validate(virtualDomain, res)
    })
    .then(function () {
      return updateDomain(virtualDomain, res)
    })
    .catch(function (error) {
      var errorBody = getCorbelErrorBody(error)
      logger.warn('SERVER', 'error:virtualDomain:create', errorBody)
      res.send(error.status, new ComposrError('error:virtualDomain:create', errorBody, error.status))
    })
}

function getVirtualDomains (req, res) {
  var authorization = auth.getAuth(req, res)

  if (!authorization) {
    res.send(401, new ComposrError('error:authorization:required', {}, 401))
    return
  }

  var domain = connection.extractDomain(authorization)
  if (domain) {
    var vDomains = engine.composr.VirtualDomain.getByDomain(domain)
    res.send(200, vDomains || [])
  } else {
    res.send(401, new ComposrError('error:domain:undefined', '', 401))
  }
}

function checkIfClientCanPublish (driver, res) {
  return driver.resources.collection(engine.domainCollection).get()
    .catch(function (error) {
      var errorBody = getCorbelErrorBody(error)
      logger.warn('SERVER', 'invalid:virtualDomain', errorBody)
      res.send(401, new ComposrError('error:virtualDomain:create', 'Unauthorized client', 401))
    })
}

function validate (virtualDomain, res) {
  return engine.composr.VirtualDomain.validator(virtualDomain)
    .catch(function (errors) {
      var message = []
      errors.forEach(function (error) {
        message.push(error.property + ': ' + error.instance + ' ' + error.message)
      })
      res.send(404, new ComposrError('error:virtualDomain:create', message, 404))
    })
}

function updateDomain (virtualDomain, res) {
  logger.debug('Storing or updating domain descriptor', virtualDomain.name, virtualDomain)
  return engine.composr.VirtualDomain.save(virtualDomain)
    .then(function (virtualDomain) {
      res.send(200, virtualDomain)
    })
}

function getCorbelErrorBody (corbelErrResponse) {
  var errorBody = typeof (corbelErrResponse.data) !== 'undefined' && typeof (corbelErrResponse.data.body) === 'string' && corbelErrResponse.data.body.indexOf('{') !== -1 ? JSON.parse(corbelErrResponse.data.body) : corbelErrResponse
  return errorBody
}

module.exports = {
  loadRoutes: function (server) {
    server.put('/vdomain', function (req, res, next) {
      createOrUpdateVirtualDomain(req, res, next)
    })

    server.get('/vdomain', function (req, res, next) {
      getVirtualDomains(req, res, next)
    })
  }
}
