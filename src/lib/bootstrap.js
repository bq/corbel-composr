'use strict';

var express = require('express'),
    router = express.Router(),
    phraseManager = require('./phraseManager'),
    connection = require('./corbelConnection');

var bootstrap = function() {
    process.env.PHRASES_COLLECTION = 'composr:Phrase';

    connection.driver.then(function(driver) {

        return driver.resources.collection(connection.PHRASES_COLLECTION).get();

    }).then(function(response) {

        return response.data.forEach(function(phrase) {
            console.log(phrase);
            phraseManager.registerPhrase(router, phrase);
        });

    }).catch(function(error) {
        console.error('Bootstrap error', error);
    });
};

bootstrap();

module.exports = router;
