'use strict';

var express = require('express'),
    router = express.Router(),
    ComposerError = require('../lib/composerError');

router.get('/e1', function(res) {
    res.undefinedFunction();
});

router.get('/e2', function() {
    throw new ComposerError('error:custom', '', 555);
});

router.get('/t1', function(req, res) {

    setTimeout(function() {
        res.send('Esto no debería verse');
    }, 100000);

});

router.get('/t2', function(req, res) {

    var tripwire = require('tripwire');

    // set the limit of execution time to 2000 milliseconds
    tripwire.resetTripwire(2000);

    var start = new Date();
    var loops = 300000;
    for (var i = 0; i < loops; i++) {
        //process.nextTick();
        console.log(i / loops);
    }

    var end = new Date();
    console.log('delay', end.valueOf() - start.valueOf());

    res.send('Esto no debería verse');

    // clear the tripwire (in this case this code is never reached)
    tripwire.clearTripwire();

});

module.exports = router;
