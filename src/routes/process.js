'use strict';

var express = require('express'),
    router = express.Router(),
    phraseProcessManager = require('../lib/phraseProcessManager');

router.get('/processes', function(req, res) {
    res.json(phraseProcessManager.getActiveProcesses());
});

module.exports = router;
