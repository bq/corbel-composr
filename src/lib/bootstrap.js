'use strict';

var express = require('express'),
    router = express.Router(),
    phraseManager = require('./phraseManager'),
    corbel = require('corbel-js'),
    config = require('../config/config.json'),
    _ = require('underscore');

var bootstrap = function() {
    process.env.PHRASES_COLLECTION = 'composr:Phrase';

    var corbelConfig = config['corbel.driver.options'];
    corbelConfig = _.extend(corbelConfig, config['corbel.composer.credentials']);

    var corbelDriver = corbel.getDriver(corbelConfig);

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
