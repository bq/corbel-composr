'use strict';

var express = require('express'),
    router = express.Router(),
    config = require('../../package.json');

router.get('/version', function(req, res) {
    res.send(config);
});

module.exports = router;
