'use strict';

var express = require('express'),
    router = express.Router(),
    phraseLoader = require('./phraseLoader');

var bootstrap = function() {
    process.env.PHRASES_COLLECTION = 'composer:Phrase';

    // @todo integrate with corbel-js
    var phrases = require('../public/mocks/phrases.json');

    phrases.forEach(function(phrase) {
        console.log(phrase);
        phraseLoader(router, phrase);
    });
};

bootstrap();

module.exports = router;
