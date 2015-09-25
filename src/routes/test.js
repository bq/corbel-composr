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

router.get('/t1', function(req, res) {
  setTimeout(function() {
    res.send('Esto no debería verse');
  }, 100000);
});

router.get('/t2', function(req, res) {

  var domain = require('domain').create();

  domain.on('error', function(err) {
    console.log('domain:error', err.message);
  });

  domain.run(function() {

    var tripwire = require('tripwire');

    tripwire.resetTripwire(1000);

    var start = new Date();
    var loops = 30000000000;
    for (var i = 0; i < loops; i++) {
      //process.nextTick();
      //console.log(i / loops);
    }

    var end = new Date();
    console.log('delay', end.valueOf() - start.valueOf());

    res.send('Esto no debería verse');

    tripwire.clearTripwire();

  });

});

router.get('/t3', function(req, res) {

  var tripwire = require('tripwire');

  tripwire.resetTripwire(1000);

  var start = new Date();
  var loops = 30000000000;
  for (var i = 0; i < loops; i++) {
    //process.nextTick();
    //console.log(i / loops);
  }

  var end = new Date();
  console.log('delay', end.valueOf() - start.valueOf());

  res.send('Esto no debería verse');

  tripwire.clearTripwire();

});


router.get('/t4', function() {

 setTimeout(function() {
  throw new ComposrError('custom:error', 'description', 555);
 }, 1500);

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

/*
router.get('/t2phrase', function(req, res, next) {


  var phrase = function phrase() {
    //Code of the phrase
    console.log('start bad phrase');

    var start = new Date();
    var loops = 30000000000;
    for (var i = 0; i < loops; i++) {
      //process.nextTick();
      //console.log(i / loops);
    }

    var end = new Date();
    console.log('delay', end.valueOf() - start.valueOf());

    res.send('Esto no debería verse');
  };

  //remove the function wrapper and only send the body to the phraseProcessManager
  var entire = phrase.toString();
  var body = entire.slice(entire.indexOf('{') + 1, entire.lastIndexOf('}'));
  var context = {
    req: req,
    res: res,
    next: next
  };

  var result = engine.composr.Phrases.evaluateCode(body);
  phraseManager.executePhrase(context, null, result.fn);

});

router.get('/t3phrase', function(req, res) {

  var phrase = function phrase() {
    res.json({
      yes: 'potatoe'
    });
  };

  //remove the function wrapper and only send the body to the phraseProcessManager
  var entire = phrase.toString();
  var body = entire.slice(entire.indexOf('{') + 1, entire.lastIndexOf('}'));
  var context = {
    req: req,
    res: res
  };

  var result = phraseManager.evaluateCode(body);
  phraseManager.executePhrase(context, null, result.fn);
});

*/
router.get('/cache', function(req, res) {
  res.set('Cache-Control', 'public, max-age=31536000');
  res.json({
    data: true
  });
});

module.exports = router;
