'use strict';

var express = require('express'),
  router = express.Router(),
  engine = require('../lib/engine'),
  ComposrError = require('../lib/ComposrError');

router.get('/doc/:domain', function(req, res, next) {

  var domain = req.params.domain || '';
  var phrases = engine.composr.Phrases.getPhrases(domain);

  engine.composr.documentation(phrases, domain)
    .then(function(result) {
      res.send(result);
    }).catch(function(err) {
      next(new ComposrError('error:phrase:doc', 'Error generating doc: ' + err, 422));
    });
});

module.exports = router;