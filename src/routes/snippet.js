'use strict'

var hub = require('../lib/hub')
var connection = require('../lib/corbelConnection')
var engine = require('../lib/engine')
var ComposrError = require('../lib/ComposrError')
var logger = require('../utils/composrLogger')
var auth = require('../lib/auth')

function getCorbelErrorBody (corbelErrResponse) {
  var errorBody = typeof (corbelErrResponse.data) !== 'undefined' && typeof (corbelErrResponse.data.body) === 'string' && corbelErrResponse.data.body.indexOf('{') !== -1 ? JSON.parse(corbelErrResponse.data.body) : corbelErrResponse
  return errorBody
}

function upsertSnippet (req, res) {
  var authorization = getAuthorization(req)
  var snippet = req.body || {}
  var driver = getDriver(authorization)
  var domain = getDomain(authorization)

  checkPublishAvailability(driver)
    .then(function () {
      validateSnippet(snippet)
        .then(function () {
          // TODO: check if we generate the snippet ID
          // snippet.id = domain + '!' + snippet.name)
          emitEvent(domain, snippet.id, 'snippet:updated_created')
          logger.debug('Storing or updating snippet', snippet.id, domain)
          upsertSnippetCall(snippet.id, snippet)
            .then(function (response) {
              res.send(response.status, response.data)
            })
            .catch(function (error) {
              var errorBody = getCorbelErrorBody(error)
              res.send(error.status, new ComposrError('error:snippet:create', errorBody, error.status))
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
      var errorBody = getCorbelErrorBody(error)
      logger.warn('SERVER', 'invalid:client:snippet', errorBody)
      res.send(401, new ComposrError('error:snippet:create', 'Unauthorized client', 401))
    })
}

function checkPublishAvailability (driver) {
  return driver.resources.collection(engine.snippetsCollection)
    .get()
}

function deleteSnippet (req, res, next) {
  var authorization = getAuthorization(req)
  var driver = getDriver(authorization)
  var snippetID = getFullSnippetId(authorization, req.params.snippetId)

  logger.debug('snippet:delete:id', snippetID)
  deleteSnippetCall(driver, snippetID)
    .then(function (response) {
      logger.debug('snippet:deleted')
      res.status(response.status).send(response.data)
    })
    .catch(function (error) {
      next(new ComposrError('error:snippet:delete', error.message, error.status))
    })
}

function getAuthorization (req) {
  return auth.getAuth(req)
}

function getDriver (authorization) {
  return connection.getTokenDriver(authorization)
}

function getDomain (authorization) {
  return connection.extractDomain(authorization)
}

function getFullSnippetId (authorization, snippetId) {
  return getDomain(authorization) + '!' + snippetId
}

function validateSnippet (snippet) {
  return engine.composr.Snippets.validate(snippet)
}

function emitEvent (domain, id, text) {
  hub.emit(text, {
    domain: domain,
    id: id
  })
}

function upsertSnippetCall (id, data) {
  return engine.composr.corbelDriver.resources.resource(engine.snippetsCollection, id)
    .update(data)
}

function deleteSnippetCall (driver, snippetId) {
  return driver.resources.resource(engine.SnippetsCollection, snippetId).delete()
}

module.exports = {
  loadRoutes: function (server) {
    server.del('/snippet/:snippetID', function (req, res, next) {
      deleteSnippet(req, res, next)
    })

    server.del('/v1.0/snippet/:snippetID', function (req, res, next) {
      deleteSnippet(req, res, next)
    })

    server.put('/snippet', function (req, res, next) {
      upsertSnippet(req, res, next)
    })

    server.put('/v1.0/snippet', function (req, res, next) {
      upsertSnippet(req, res, next)
    })
  },
  getCorbelErrorBody: getCorbelErrorBody,
  upsertSnippet: upsertSnippet,
  checkPublishAvailability: checkPublishAvailability,
  deleteSnippet: deleteSnippet,
  getAuthorization: getAuthorization,
  getDriver: getDriver,
  getDomain: getDomain,
  getFullSnippetId: getFullSnippetId,
  validateSnippet: validateSnippet,
  emitEvent: emitEvent,
  upsertSnippetCall: upsertSnippetCall,
  deleteSnippetCall: deleteSnippetCall
}
