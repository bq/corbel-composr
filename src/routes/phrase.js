'use strict';

var express = require('express'),
    corbel = require('../../vendor/corbel'),
    config = require('../config/config.json'),
    router = express.Router();


var extractDomain = function(token) {
    var decoded = atob(token.replace('Bearer ', '').split('.')[0]);
    return JSON.parse(decoded).domainId;
};

/**
 * [Create or update a phrase]
 * @param  phrase:
 *         {
              "name": "name",
              "method": "GET",
              "code": "{}"
            }
 * @return {promise}
 */
router.put('/phrase', function(req, res) {
    var phrase = req.body || {};

    phrase.url = extractDomain(req.get('Authorization')) + '/' + phrase.name;

    var corbelDriver = corbel.getDriver(config.composr.corbel.options);

    corbelDriver.iam.token().create().then(function() {
        return corbelDriver.resources.collection(process.env.PHRASES_COLLECTION).add('application/json', phrase);
    }).then(function(response) {
        res.send(response);
    }).catch(function(error) {
        console.error('Put phrase error', error);
    });

    // @todo integrate with corbel.js
    // res.send(corbel.resources(process.env.PHRASES_COLLECTION, phrase.url).update(phrase));
    // res.send('new phrase!');
});

module.exports = router;
