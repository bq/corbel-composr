'use strict'

var pmx = require('pmx')
var connection = require('../lib/corbelConnection')
var engine = require('../lib/engine')
var ComposrError = require('../lib/ComposrError')
var logger = require('../utils/composrLogger')
var auth = require('../lib/auth')

/* ************************************
  Metrics
*************************************/
var probe = pmx.probe()

var counterPhrasesUpdated = probe.counter({
  name: 'phrases_updated'
})

function getCorbelErrorBody (corbelErrResponse) {
  var errorBody = typeof (corbelErrResponse.data) !== 'undefined' && typeof (corbelErrResponse.data.body) === 'string' && corbelErrResponse.data.body.indexOf('{') !== -1 ? JSON.parse(corbelErrResponse.data.body) : corbelErrResponse
  return errorBody
}

/**
 * Creates or updates a phrase
 * example phrase {
 *     "url": "phrase1/:pathparam",
 *     "get": {
 *         "code": "",
 *         "doc": {
 *             "description": "This method will get all songs\n",
 *             "queryParameters": {
 *                 "genre": {
 *                     "description": "filter the songs by genre"
 *                 }
 *             },
 *             "responses": {
 *                 "200": {
 *                     "body": {
 *                         "application/json": {
 *                             "schema": "{ \"$schema\": \"http://json-schema.org/schema\",\n  \"type\": \"object\",\n  \"description\": \"A canonical song\",\n  \"properties\": {\n    \"title\":  { \"type\": \"string\" },\n    \"artist\": { \"type\": \"string\" }\n  },\n  \"required\": [ \"title\", \"artist\" ]\n}\n"
 *                         },
 *                         "application/xml": null
 *                     }
 *                 }
 *             }
 *         }
 *     }
 *     "post": {
 *         ...
 *     },
 *     "put": {
 *         ...
 *     },
 *     "delete": {
 *         ...
 *     }
 * }
 *
 * @param  {json} phrase body
 * @return {promise}
 */
function createOrUpdatePhrase (req, res) {
  // Metrics for phrases updated since last restart
  counterPhrasesUpdated.inc()

  var authorization = auth.getAuth(req, res)

  var phrase = req.body || {}

  var clientCorbelDriver = connection.getTokenDriver(authorization)

  var domain = connection.extractDomain(authorization)

  checkIfClientCanPublish(clientCorbelDriver)
    .then(function () {
      engine.composr.Phrases.validate(phrase)
        .then(function () {
          phrase.id = domain + '!' + phrase.url.replace(/\//g, '!')
          pmx.emit('phrase:updated_created', {
            domain: domain,
            id: phrase.id
          })

          logger.debug('Storing or updating phrase', phrase.id, domain)

          engine.composr.corbelDriver.resources.resource(engine.phrasesCollection, phrase.id)
            .update(phrase)
            .then(function (response) {
              res.setHeader('Location', 'phrase/' + phrase.id)
              res.send(response.status, response.data)
            })
            .catch(function (error) {
              var errorBody = getCorbelErrorBody(error)
              res.send(error.status, new ComposrError('error:phrase:create', errorBody, error.status))
            })
        })
        .catch(function (result) {
          var errors = result.errors
          logger.warn('SERVER', 'invalid:phrase', phrase.id, result)
          res.send(422, new ComposrError('error:phrase:validation', 'Error validating phrase: ' +
            JSON.stringify(errors, null, 2), 422))
        })
    })
    .catch(function (error) {
      var errorBody = getCorbelErrorBody(error)
      logger.warn('SERVER', 'invalid:client:phrase', errorBody)
      res.send(401, new ComposrError('error:phrase:create', 'Unauthorized client', 401))
    })
}

function checkIfClientCanPublish (driver) {
  return driver.resources.collection(engine.phrasesCollection)
    .get()
}
/**
 * Deletes a phrase
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 * TODO: unregister phrase on core,
 */
function deletePhrase (req, res) {
  var authorization = auth.getAuth(req, res)

  if (!authorization) {
    res.send(401, new ComposrError('error:authorization:required', {}, 401))
  }

  var corbelDriver = connection.getTokenDriver(authorization)

  var phraseId = connection.extractDomain(authorization) + '!' + req.params.phraseid

  logger.debug('phrase:delete:id', phraseId)
  corbelDriver.resources.resource(engine.phrasesCollection, phraseId).delete().then(function (response) {
    logger.debug('phrase:deleted')
    res.send(response.status, response.data)
  })
    .catch(function (error) {
      res.send(error.status, new ComposrError('error:phrase:delete', error.message, error.status))
    })
}

/**
 * Returns a phrase by id
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function getPhrase (req, res) {
  var authorization = auth.getAuth(req, res)

  var corbelDriver = connection.getTokenDriver(authorization)

  var phraseId = connection.extractDomain(authorization) + '!' + req.params.phraseid

  logger.debug('Trying to get phrase:', phraseId)

  corbelDriver.resources.resource(engine.phrasesCollection, phraseId).get().then(function (response) {
    res.send(response.status, response.data)
  })
    .catch(function (error) {
      var errorBody = getCorbelErrorBody(error)
      res.send(error.status, new ComposrError('error:phrase:get', errorBody, error.status))
    })
}

/**
 * Returns all the domain phrases
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
function getPhrases (req, res) {
  var authorization = auth.getAuth(req, res)

  if (!authorization) {
    res.send(401, new ComposrError('error:authorization:required', {}, 401))
    return
  }

  var domainExtracted = connection.extractDomain(authorization)
  if (domainExtracted) {
    var phrases = engine.composr.Phrases.getPhrases(domainExtracted)
    res.send(200, phrases || [])
  } else {
    res.send(401, new ComposrError('error:domain:undefined', '', 401))
  }
}

/**
 *
 * Meta-Endpoint for compoSR phrases
 * req.route.path => '/apps-sandbox/login'
 * domain => 'apps-sandbox'
 * phrasePath => 'login'
 */
module.exports = function (server) {
  server.get('/phrase', function (req, res) {
    getPhrases(req, res)
  })

  server.get('/v1.0/phrase', function (req, res) {
    getPhrases(req, res)
  })

  server.put('/phrase', function (req, res, next) {
    createOrUpdatePhrase(req, res, next)
  })

  server.put('/v1.0/phrase', function (req, res, next) {
    createOrUpdatePhrase(req, res, next)
  })

  server.del('/phrase/:phraseid', function (req, res, next) {
    deletePhrase(req, res, next)
  })

  server.del('/v1.0/phrase/:phraseid', function (req, res, next) {
    deletePhrase(req, res, next)
  })

  server.get('/phrase/:phraseid', function (req, res, next) {
    getPhrase(req, res, next)
  })

  server.get('/v1.0/phrase/:phraseid', function (req, res, next) {
    getPhrase(req, res, next)
  })
}
