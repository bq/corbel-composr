'use strict';

var express = require('express'),
    router = express.Router(),
    auth = require('../lib/auth'),
    phraseManager = require('../lib/phraseManager'),
    connection = require('../lib/corbelConnection'),
    docBuilder = require('../lib/docBuilder'),
    ComposerError = require('../lib/composerError'),
    raml2html = require('raml2html');

router.get('/doc', function(req, res) {

    var authorization = auth.getAuth(req);
    var domain = connection.extractDomain(authorization);
    var phrases = phraseManager.getPhrases(domain);
    phrases = phrases || [];

    var source = docBuilder.buildDefinition(domain, phrases);
    var config = raml2html.getDefaultConfig(true);

    raml2html.render(source, config, function(result) {
        res.send(result);
    }, function(error) {
        throw new ComposerError('error:phrase:doc', 'Error generating doc: ' + error, 422);
    });
});

module.exports = router;
