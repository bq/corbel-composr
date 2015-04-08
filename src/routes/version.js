'use strict';

var express = require('express'),
    router = express.Router(),
    config = require('../../package.json');

/* GET home page. */

router.get('/version', function(req, res) {
    res.send(config);
});

module.exports = router;
