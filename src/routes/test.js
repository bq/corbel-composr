'use strict';

var express = require('express'),
  router = express.Router(),
  corbel = require('corbel-js'),
  ComposrError = require('../lib/ComposrError'),
  config = require('../lib/config');

router.get('/e1', function(res) {
  res.undefinedFunction();
});

router.get('/e2', function() {
  throw new ComposrError('error:custom', '', 555);
});

router.post('/jwt', function(req, res) {

  req.body = req.body || {};
  req.body.claims.aud = corbel.Iam.AUD;

  res.json(corbel.jwt.generate(req.body.claims, req.body.secret));

});

router.post('/token', function(req, res, next) {

    var data = req.body || {};

    var corbelConfig = config('corbel.driver.options');

    corbelConfig.clientId = data.clientId;
    corbelConfig.clientSecret = data.clientSecret;
    corbelConfig.scopes = data.scopes;

    var corbelDriver = corbel.getDriver(corbelConfig);

    corbelDriver.iam.token().create().then(function(response) {
        res.send(response);
    }).catch(function(error) {
        next(new ComposrError('error:token', error, error.status));
    });

});

router.get('/cache', function(req, res) {
  res.set('Cache-Control', 'public, max-age=31536000');
  res.json({
    data: true
  });
});

module.exports = router;
