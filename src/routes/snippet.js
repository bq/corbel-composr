'use strict';

var express = require('express'),
  router = express.Router(),
  pmx = require('pmx'),
  connection = require('../lib/corbelConnection'),
  engine = require('../lib/engine'),
  ComposrError = require('../lib/ComposrError'),
  logger = require('../utils/logger'),
  auth = require('../lib/auth');


function getCorbelErrorBody(corbelErrResponse) {
  var errorBody = typeof(corbelErrResponse.data) !== 'undefined' && typeof(corbelErrResponse.data.body) === 'string' && corbelErrResponse.data.body.indexOf('{') !== -1 ? JSON.parse(corbelErrResponse.data.body) : corbelErrResponse;
  return errorBody;
}

function createOrUpdateSnippet(req, res, next) {

  var authorization = auth.getAuth(req);

  var snippet = req.body || {};

  var corbelDriver = connection.getTokenDriver(authorization);

  var domain = connection.extractDomain(authorization);

  engine.composr.Snippets.validate(snippet)
    .then(function() {
      //TODO: check if we generate the snippet ID
      //snippet.id = domain + '!' + snippet.name);
      pmx.emit('snippet:updated_created', {
        domain: domain,
        id: snippet.id
      });

      logger.debug('Storing or updating snippet', snippet.id, domain);

      corbelDriver.resources.resource(engine.snippetsCollection, snippet.id)
        .update(snippet)
        .then(function(response) {
          res.status(response.status).send(response.data);
        }).catch(function(error) {
          var errorBody = getCorbelErrorBody(error);
          next(new ComposrError('error:snippet:create', errorBody, error.status));
        });
    })
    .catch(function(result) {
      var errors = result.errors;
      logger.warn('SERVER', 'invalid:snippet', snippet.id, result);
      next(new ComposrError('error:snippet:validation', 'Error validating snippet: ' +
        JSON.stringify(errors, null, 2), 422));
    });

}

router.put('/snippet', function(req, res, next) {
  createOrUpdateSnippet(req, res, next);
});

router.put('/v1.0/snippet', function(req, res, next) {
  createOrUpdateSnippet(req, res, next);
});



function deleteSnippet(req, res, next) {
  var authorization = auth.getAuth(req);

  var corbelDriver = connection.getTokenDriver(authorization);

  var snippetID = connection.extractDomain(authorization) + '!' + req.params.snippetID;
  logger.debug('snippet:delete:id', snippetID);
  corbelDriver.resources.resource(engine.SnippetsCollection, snippetID).delete().then(function(response) {
    logger.debug('snippet:deleted');
    res.status(response.status).send(response.data);
  }).catch(function(error) {
    next(new ComposrError('error:snippet:delete', error.message, error.status));
  });

}

router.delete('/snippet/:snippetID', function(req, res, next) {
  deleteSnippet(req, res, next);
});

router.delete('/v1.0/snippet/:snippetID', function(req, res, next) {
  deleteSnippet(req, res, next);
});



module.exports = router;