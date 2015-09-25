'use strict';

var express = require('express'),
  router = express.Router(),
  engine = require('../lib/engine'),
  ComposrError = require('../lib/ComposrError');

router.get('/doc/:domain', function(req, res, next) {

  var domain = req.params.domain || '';
  //TODO move to core
  var rawPhrases = engine.composr.data.phrases;
  var domainPhrases = rawPhrases.filter(function(item) {
    return item.id.split('!')[0] === domain;
  });

  engine.composr.documentation(domainPhrases, domain)
    .then(function(result) {
      res.send(result);
    }).catch(function(err) {
      console.log('asd22asd');
      next(new ComposrError('error:phrase:doc', 'Error generating doc: ' + err, 422));
    });
});

module.exports = router;