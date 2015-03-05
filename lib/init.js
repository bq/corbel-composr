'use strict';

var sr = require('sr'),
    phraseLoader = require('./phraseLoader');

var init = function() {
    process.env.PHRASES_COLLECTION = 'composr:Phrase';

    return sr.resources.collection(process.env.PHRASES_COLLECTION).get().then(function(phrases) {
        phrases.forEach(function(phrase) {
            phraseLoader.loadPhrase(phrase);
        });
    });
};

module.exports = init;
