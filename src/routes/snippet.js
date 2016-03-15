'use strict'

var hub = require('../lib/hub')
var connection = require('../lib/corbelConnection')
var engine = require('../lib/engine')
var ComposrError = require('../lib/ComposrError')
var logger = require('../utils/composrLogger')
var auth = require('../lib/auth')

var Snippet = {}

Snippet.getCorbelErrorBody = function (corbelErrResponse) {
  var errorBody = typeof (corbelErrResponse.data) !== 'undefined' &&
  typeof (corbelErrResponse.data.body) === 'string' &&
  corbelErrResponse.data.body.indexOf('{') !== -1
    ? JSON.parse(corbelErrResponse.data.body) : corbelErrResponse

  return errorBody.data ? errorBody.data : errorBody
}

Snippet.upsert = function (req, res) {
  var authorization = Snippet.getAuthorization(req)
  var snippet = req.body || {}
  var driver = Snippet.getDriver(authorization)
  var domain = Snippet.getDomain(authorization)

  Snippet.checkPublishAvailability(driver)
    .then(function () {
      Snippet.validate(snippet)
        .then(function () {
          // TODO: check if we generate the snippet ID
          // snippet.id = domain + '!' + snippet.name)
          Snippet.emitEvent('snippet:upsert', domain, snippet.name)
          logger.debug('Storing or updating snippet', snippet.name, domain)
          Snippet.upsertCall(snippet)
            .then(function (response) {
              res.send(response.status, response.data)
            })
            .catch(function (error) {
              var errorBody = Snippet.getCorbelErrorBody(error)
              logger.warn('SERVER', 'invalid:upsert:snippet', errorBody)
              res.send(error.status, new ComposrError('error:upsert:snippet', errorBody, error.status))
            })
        })
        .catch(function (result) {
          var errors = result.errors
          logger.warn('SERVER', 'invalid:snippet', snippet.id, result)
          res.send(422, new ComposrError('error:snippet:validation', 'Error validating snippet: ' +
            JSON.stringify(errors, null, 2), 422))
        })
    })
    .catch(function (error) {
      logger.warn('SERVER', 'invalid:client:snippet', error)
      res.send(401, new ComposrError('error:upsert:snippet', 'Unauthorized client', 401))
    })
}

Snippet.delete = function (req, res, next) {
  var authorization = Snippet.getAuthorization(req)
  var driver = Snippet.getDriver(authorization)
  var domain = Snippet.getDomain(authorization)

  logger.debug('Request delete snippet:', req.params.snippetId)

  Snippet.checkPublishAvailability(driver)
    .then(function () {
      var snippet = Snippet.getCall(req.params.snippetId)

      if (snippet && snippet.getDomain() === domain) {
        Snippet.deleteCall(driver, req.params.snippetId)
          .then(function (response) {
            logger.debug('snippet:deleted')
            res.send(response.status, response.data)
          })
          .catch(function (error) {
            res.send(error.status, new ComposrError('error:snippet:delete', error.message, error.status))
          })
      } else {
        throw new Error('Unauthorized client, trying to delete a phrase of another domain')
      }
    })
    .catch(function (error) {
      logger.warn('SERVER', 'invalid:client:snippet:delete', error)
      res.send(401, new ComposrError('error:delete:snippet', 'Unauthorized client', 401))
    })
}

Snippet.getAuthorization = function (req) {
  // This may throw an error, causing the server.on('uncaughtException') to be fired.
  return auth.getAuth(req)
}

Snippet.getDriver = function (authorization) {
  return connection.getTokenDriver(authorization)
}

Snippet.getDomain = function (authorization) {
  return connection.extractDomain(authorization)
}

Snippet.checkPublishAvailability = function (driver) {
  return driver.resources.collection(engine.snippetsCollection)
    .get()
    .catch(function () {
      throw new Error('Invalid client')
    })
}

Snippet.validate = function (snippet) {
  return engine.composr.Snippet.validate(snippet)
}

Snippet.emitEvent = function (text, domain, id) {
  hub.emit(text, domain, id)
}

Snippet.upsertCall = function (data) {
  return engine.composr.Snippet.save(data)
}

Snippet.deleteCall = function (driver, id) {
  // TODO: use core if needed
  return driver.resources.resource(engine.snippetsCollection, id).delete()
}

module.exports = {
  loadRoutes: function (server) {
    server.del('/snippet/:snippetId', function (req, res, next) {
      Snippet.delete(req, res, next)
    })

    server.del('/v1.0/snippet/:snippetId', function (req, res, next) {
      Snippet.delete(req, res, next)
    })

    server.put('/snippet', function (req, res, next) {
      Snippet.upsert(req, res, next)
    })

    server.put('/v1.0/snippet', function (req, res, next) {
      Snippet.upsert(req, res, next)
    })
  },
  Snippet: Snippet
}
