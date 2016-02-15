'use strict'

var pmx = require('pmx')
var _ = require('lodash')
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
      Phrase.validate(phrase)
        .then(function () {
          phrase.id = domain + '!' + phrase.url.replace(/\//g, '!')
          Phrase.emitEvent('phrase:upsert', domain, phrase.id)
          logger.info('Storing or updating phrase', phrase.id, domain)

          Phrase.upsertCall(phrase.id, phrase)
            .then(function (response) {
              res.setHeader('Location', 'phrase/' + phrase.id)
              res.send(response.status, response.data)
            })
            .catch(function (error) {
              var errorBody = Phrase.getCorbelErrorBody(error)
              logger.warn('SERVER', 'invalid:upsert:phrase', errorBody)
              res.send(error.status, new ComposrError('error:upsert:phrase', errorBody, error.status))
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
      var errorBody = Phrase.getCorbelErrorBody(error)
      logger.warn('SERVER', 'invalid:client:phrase', errorBody)
      res.send(401, new ComposrError('error:upsert:phrase', 'Unauthorized client', 401))
    })
}

/**
 * Deletes a phrase
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 * TODO: unregister phrase on core,
 */
Phrase.delete = function (req, res) {
  var authorization = Phrase.getAuthorization(req)
  var driver = Phrase.getDriver(authorization)
  var domain = Phrase.getDomain(authorization)
  var phraseId = Phrase.getFullId(domain, req.params.phraseId)
  logger.debug('Request delete phrase:', phraseId)

  Phrase.deleteCall(driver, phraseId)
    .then(function (response) {
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
Phrase.get = function (req, res) {
  var authorization = Phrase.getAuthorization(req)
  var domain = Phrase.getDomain(authorization)
  if (!authorization || !domain) {
    res.send(401, new ComposrError('error:unauthorized', 'Invalid credentials', 401))
    return
  }
  var phraseId = Phrase.getFullId(domain, req.params.phraseId)

  logger.debug('Trying to get phrase:', phraseId)
  var phrase = Phrase.getCall(domain, phraseId)
  if (phrase) {
    res.send(200, phrase)
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
    var phrases = Phrase.getAllCall(domain)
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
  return driver.resources.collection(engine.phrasesCollection).get()
}

Phrase.validate = function (phrase) {
  return engine.composr.Phrases.validate(phrase)
}

Phrase.emitEvent = function (text, domain, id) {
  hub.emit(text, domain, id)
}

Phrase.getFullId = function (domain, id) {
  return domain + '!' + id
}

Phrase.upsertCall = function (id, data) {
  return engine.composr.corbelDriver.resources.resource(engine.phrasesCollection, id)
    .update(data)
}

Phrase.deleteCall = function (driver, id) {
  return driver.resources.resource(engine.phrasesCollection, id).delete()
}

Phrase.getCall = function (domain, id) {
  var phrases = Phrase.getAllCall(domain)
  return _.filter(phrases, function (o) {
    return o.id === id
  })[0]
}

Phrase.getAllCall = function (domain) {
  return engine.composr.Phrases.getPhrases(domain)
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
