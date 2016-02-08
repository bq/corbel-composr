'use strict'

var pmx = require('pmx')
var connection = require('../lib/corbelConnection')
var engine = require('../lib/engine')
var ComposrError = require('../lib/ComposrError')
var logger = require('../utils/composrLogger')
var auth = require('../lib/auth')

function getCorbelErrorBody (corbelErrResponse) {
  var errorBody = typeof (corbelErrResponse.data) !== 'undefined' && typeof (corbelErrResponse.data.body) === 'string' && corbelErrResponse.data.body.indexOf('{') !== -1 ? JSON.parse(corbelErrResponse.data.body) : corbelErrResponse
  return errorBody
}

function createOrUpdateSnippet (req, res) {
  var authorization = getAuthorization(req)
  var snippet = req.body || {}
  var driver = getToken(authorization)
  var domain = getDomain(authorization)

  checkIfClientCanPublish(driver)
    .then(function () {
      validateSnippet(snippet)
        .then(function () {
          // TODO: check if we generate the snippet ID
          // snippet.id = domain + '!' + snippet.name)
          emitEvent(domain, snippet.id, 'snippet:updated_created')
          logger.debug('Storing or updating snippet', snippet.id, domain)
          makeSnippetCreationOrUpdate(snippet.id, snippet)
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

function checkIfClientCanPublish (driver) {
  return driver.resources.collection(engine.snippetsCollection)
    .get()
}

function deleteSnippet (req, res, next) {
  var authorization = getAuthorization(req)
  var driver = getToken(authorization)
  var snippetID = getFullSnippetId(authorization, req.params.snippetId)

  logger.debug('snippet:delete:id', snippetID)
  makeSnippetDeletion(driver, snippetID)
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

function getToken (authorization) {
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
  pmx.emit(text, {
    domain: domain,
    id: id
  })
}

function makeSnippetCreationOrUpdate (id, data) {
  return engine.composr.corbelDriver.resources.resource(engine.snippetsCollection, id)
    .update(data)
}

function makeSnippetDeletion (driver, snippetId) {
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
      createOrUpdateSnippet(req, res, next)
    })

    server.put('/v1.0/snippet', function (req, res, next) {
      createOrUpdateSnippet(req, res, next)
    })
  },
  getCorbelErrorBody: getCorbelErrorBody,
  createOrUpdateSnippet: createOrUpdateSnippet,
  checkIfClientCanPublish: checkIfClientCanPublish,
  deleteSnippet: deleteSnippet,
  getAuthorization: getAuthorization,
  getToken: getToken,
  getDomain: getDomain,
  getFullSnippetId: getFullSnippetId,
  validateSnippet: validateSnippet,
  emitEvent: emitEvent,
  makeSnippetCreationOrUpdate: makeSnippetCreationOrUpdate,
  makeSnippetDeletion: makeSnippetDeletion
}
