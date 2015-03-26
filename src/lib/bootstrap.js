'use strict';

var express = require('express'),
    router = express.Router(),
    phraseManager = require('./phraseManager'),
    corbel = require('../../vendor/corbel'),
    config = require('../config/config.json');

var bootstrap = function() {
    process.env.PHRASES_COLLECTION = 'composr:Phrase';

    var corbelDriver = corbel.getDriver(config['composr.corbel.options']);

    corbelDriver.iam.token().create().then(function() {
        return corbelDriver.resources.collection(process.env.PHRASES_COLLECTION).get();
    }).then(function(response) {
        response.data.forEach(function(phrase) {
            console.log(phrase);
            phraseManager.registerPhrase(router, phrase);
        });
    }).catch(function(error) {
        console.error('Bootstrap error', error);
    });
};

bootstrap();

module.exports = router;
