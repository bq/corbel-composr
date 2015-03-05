'use strict';

var express = require('express'),
    router = express.Router(),
    phraseLoader = require('./phraseLoader');

var init = function() {
    process.env.PHRASES_COLLECTION = 'composr:Phrase';

    // @todo integrate with silkroad-js
    var phrases = require('../public/mocks/phrases.json');

    phrases.forEach(function(phrase) {
        console.log(phrase);
        phraseLoader(router, phrase);
    });
};

init();

module.exports = router;
