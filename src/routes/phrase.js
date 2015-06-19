'use strict';

var express = require('express'),
  router = express.Router(),
  pmx = require('pmx'),
  connection = require('../lib/corbelConnection'),
  phraseManager = require('../lib/phraseManager'),
  phraseValidator = require('../lib/phraseValidator'),
  ComposerError = require('../lib/composerError'),
  logger = require('../utils/logger'),
  auth = require('../lib/auth');

/*************************************
  Metrics
*************************************/
var probe = pmx.probe();

var counterPhrasesBeingExecuted = probe.counter({
  name: 'phrases_on_execution'
});

var counterPhrasesExecuted = probe.counter({
  name: 'phrases_executed'
});

var counterPhrasesUpdated = probe.counter({
  name: 'phrases_updated'
});

function getCorbelErrorBody(corbelErrResponse) {
  var errorBody = typeof(corbelErrResponse.data) !== 'undefined' && typeof(corbelErrResponse.data.body) === 'string' && corbelErrResponse.data.body.indexOf('{') !== -1 ? JSON.parse(corbelErrResponse.data.body) : corbelErrResponse;
  return errorBody;
}

/**
 * Creates or updates a phrase
 * @param  phrase:
 * {
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
 * @return {promise}
 */
router.put('/phrase', function(req, res, next) {
  //Metrics for phrases updated since last restart
  counterPhrasesUpdated.inc();

  var authorization = auth.getAuth(req);

  var phrase = req.body || {};

  var corbelDriver = connection.getTokenDriver(authorization);

  var domain = connection.extractDomain(authorization);

  phraseValidator.validate(domain, phrase).then(function() {

    phrase.id = domain + '!' + phrase.url.replace(/\//g, '!');

    pmx.emit('phrase:updated_created', {
      domain: domain,
      id: phrase.id
    });

    logger.debug('Storing or updating phrase', phrase.id, domain);

    corbelDriver.resources.resource(process.env.PHRASES_COLLECTION, phrase.id).update(phrase).then(function(response) {
      res.set('Location', 'phrase/' + phrase.id);
      res.status(response.status).send(response.data);
    }).catch(function(error) {
      var errorBody = getCorbelErrorBody(error);
      next(new ComposerError('error:phrase:create', errorBody, error.status));
    });

  }, function(error) {
    next(new ComposerError('error:phrase:validation', 'Error validating phrase: ' + error, 422));
  });

});

router.delete('/phrase/:phraseid', function(req, res, next) {
  var authorization = auth.getAuth(req);

  var corbelDriver = connection.getTokenDriver(authorization);

  var phraseId = connection.extractDomain(authorization) + '!' + req.params.phraseid;
  logger.debug('phrase:delete:id', phraseId);
  corbelDriver.resources.resource(process.env.PHRASES_COLLECTION, phraseId).delete().then(function(response) {
    logger.debug('phrase:deleted');
    res.status(response.status).send(response.data);
  }).catch(function(error) {
    next(new ComposerError('error:phrase:delete', error.message, error.status));
  });

});

router.get('/phrase/:phraseid', function(req, res, next) {
  var authorization = auth.getAuth(req);

  var corbelDriver = connection.getTokenDriver(authorization);

  var phraseId = connection.extractDomain(authorization) + '!' + req.params.phraseid;

  logger.debug('Trying to get phrase:', phraseId);

  corbelDriver.resources.resource(process.env.PHRASES_COLLECTION, phraseId).get().then(function(response) {
    res.send(response.status, response.data);
  }).catch(function(error) {
    var errorBody = getCorbelErrorBody(error);
    next(new ComposerError('error:phrase:get', errorBody, error.status));
  });
});

router.get('/phrase', function(req, res) {
  var authorization = auth.getAuth(req);
  res.json(phraseManager.getPhrases(connection.extractDomain(authorization)));
});

/**
 *
 * Meta-Endpoint for compoSR phrases
 * req.path => '/apps-sandbox/login'
 * domain => 'apps-sandbox'
 * phrasePath => 'login'
 */
router.all('*', function(req, res, next) {
  //Metrics for phrases being executed at this moment
  counterPhrasesBeingExecuted.inc();
  counterPhrasesExecuted.inc();

  res.on('finish', function() {
    counterPhrasesBeingExecuted.dec();
  });

  var path = req.path.slice(1).split('/'),
    domain = path[0],
    phrasePath = path.slice(1).join('/');

  if (!domain || !phrasePath) {
    return next();
  }

  return phraseManager.run(domain, phrasePath, req, res, next);
});

module.exports = router;