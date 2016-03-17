'use strict'

var pmx = require('pmx')
var hub = require('../lib/hub')
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

var Phrase = {}

Phrase.getCorbelErrorBody = function (corbelErrResponse) {
  var errorBody = typeof (corbelErrResponse.data) !== 'undefined' &&
  typeof (corbelErrResponse.data.body) === 'string' &&
  corbelErrResponse.data.body.indexOf('{') !== -1
    ? JSON.parse(corbelErrResponse.data.body) : corbelErrResponse
  return errorBody.data ? errorBody.data : errorBody
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
Phrase.upsert = function (req, res) {
  // Metrics for phrases updated since last restart
  counterPhrasesUpdated.inc()

  var authorization = Phrase.getAuthorization(req)
  var phrase = req.body || {}
  var driver = Phrase.getDriver(authorization)
  var domain = Phrase.getDomain(authorization)

  Phrase.checkPublishAvailability(driver)
    .then(function () {
      Phrase.validate(phrase, res)
        .then(function () {
          Phrase.upsertCall(phrase, res)
        })
    })
    .catch(function () {
      logger.warn('SERVER', 'invalid:client:phrase:upsert', domain, authorization)
      res.send(401, new ComposrError('error:upsert:phrase', 'Unauthorized client', 401))
    })
}

/**
 * Deletes a phrase
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 * TODO: Implement the the delete mechanism using the core driver
 * but check if that phrase
 */
Phrase.delete = function (req, res) {
  var authorization = Phrase.getAuthorization(req)
  var driver = Phrase.getDriver(authorization)
  var domain = Phrase.getDomain(authorization)
  logger.debug('Request delete phrase:', req.params.phraseId)

  Phrase.checkPublishAvailability(driver)
    .then(function () {
      var phrase = engine.composr.Phrase.getById(req.params.phraseId)

      if (phrase && phrase.getDomain() === domain) {
        Phrase.deleteCall(driver, req.params.phraseId)
          .then(function (response) {
            logger.debug('phrase:deleted')
            res.send(response.status, response.data)
          })
          .catch(function (error) {
            res.send(error.status, new ComposrError('error:phrase:delete', error.message, error.status))
          })
      } else {
        throw new Error('Unauthorized client, trying to delete a phrase of another domain')
      }
    })
    .catch(function (error) {
      logger.warn('SERVER', 'invalid:client:phrase:delete', error)
      res.send(401, new ComposrError('error:delete:phrase', 'Unauthorized client', 401))
    })
}

/**
 * Returns a phrase by id
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
Phrase.get = function (req, res) {
  var authorization = Phrase.getAuthorization(req)
  var domain = Phrase.getDomain(authorization)

  if (!authorization || !domain) {
    res.send(401, new ComposrError('error:unauthorized', 'Invalid credentials', 401))
    return
  }

  logger.debug('Trying to get phrase:', req.params.phraseId)

  var phrase = Phrase.getCall(req.params.phraseId)

  if (phrase) {
    res.send(200, phrase.getRawModel())
  } else {
    res.send(404, new ComposrError('error:phrase:not_found', 'The phrase you are requesting is missing', 404))
  }
}

/**
 * Returns all the domain phrases
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
Phrase.getAll = function (req, res) {
  var authorization = Phrase.getAuthorization(req)
  var domain = Phrase.getDomain(authorization)
  if (domain) {
    var phrases = engine.composr.Phrase.getPhrases(domain)
    res.send(200, phrases || [])
  } else {
    res.send(401, new ComposrError('error:domain:undefined', '', 401))
  }
}

Phrase.getAuthorization = function (req) {
  return auth.getAuth(req)
}

Phrase.getDriver = function (authorization) {
  return connection.getTokenDriver(authorization)
}

Phrase.getDomain = function (authorization) {
  return connection.extractDomain(authorization)
}

Phrase.checkPublishAvailability = function (driver) {
  return driver.resources.collection(engine.phrasesCollection)
    .get()
    .catch(function () {
      throw new Error('Invalid client')
    })
}

Phrase.validate = function (phrase, res) {
  return engine.composr.Phrase.validate(phrase)
    .catch(function (result) {
      var errors = result.errors
      logger.warn('SERVER', 'invalid:phrase', phrase.url, result)
      res.send(422, new ComposrError('error:phrase:validation', 'Error validating phrase: ' +
        JSON.stringify(errors, null, 2), 422))
    })
}

Phrase.upsertCall = function (item, res) {
  return engine.composr.Phrase.save(item)
    .then(function (phrase) {
      res.setHeader('Location', 'phrase/' + phrase.id)
      res.send(200, phrase)
    })
    .catch(function (error) {
      logger.warn('SERVER', 'invalid:upsert:phrase', error)
      res.send(error)
    })
}

Phrase.emitEvent = function (text, domain, id) {
  hub.emit(text, domain, id)
}

Phrase.deleteCall = function (driver, id) {
  // TODO: use the core if needed
  return driver.resources.resource(engine.phrasesCollection, id).delete()
}

Phrase.getCall = function (id) {
  return engine.composr.Phrase.getById(id)
}

/**
 *
 * Meta-Endpoint for compoSR phrases
 * req.route.path => '/apps-sandbox/login'
 * domain => 'apps-sandbox'
 * phrasePath => 'login'
 */
module.exports = {
  loadRoutes: function (server) {
    server.put('/phrase', function (req, res, next) {
      Phrase.upsert(req, res, next)
    })

    server.put('/v1.0/phrase', function (req, res, next) {
      Phrase.upsert(req, res, next)
    })

    server.del('/phrase/:phraseId', function (req, res, next) {
      Phrase.delete(req, res, next)
    })

    server.del('/v1.0/phrase/:phraseId', function (req, res, next) {
      Phrase.delete(req, res, next)
    })

    server.get('/phrase/:phraseId', function (req, res, next) {
      Phrase.get(req, res, next)
    })

    server.get('/v1.0/phrase/:phraseId', function (req, res, next) {
      Phrase.get(req, res, next)
    })
    server.get('/phrase', function (req, res) {
      Phrase.getAll(req, res)
    })

    server.get('/v1.0/phrase', function (req, res) {
      Phrase.getAll(req, res)
    })
  },
  Phrase: Phrase
}
