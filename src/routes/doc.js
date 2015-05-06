'use strict';

var express = require('express'),
    router = express.Router(),
    phraseManager = require('../lib/phraseManager'),
    docBuilder = require('../lib/docBuilder'),
    ComposerError = require('../lib/composerError'),
    raml2html = require('raml2html');

router.get('/doc/:domain', function(req, res, next) {

    var domain = req.params.domain || '';
    var phrases = phraseManager.getPhrases(domain);

    var source = docBuilder.buildDefinition(domain, phrases);
    var config = raml2html.getDefaultConfig(true);

    raml2html.render(source, config, function(result) {
        res.send(result);
    }, function(error) {
        next(new ComposerError('error:phrase:doc', 'Error generating doc: ' + error, 422));
    });
});

module.exports = router;
