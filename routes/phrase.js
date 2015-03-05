'use strict';

var express = require('express'),
    router = express.Router(),
    //sr = require('sr');
    sr = {};

var extractDomain = function(Authorization) {
    console.log(Authorization);
    return 'domain';
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

    phrase.url = extractDomain(req.get('Authorization')) + ':' + phrase.name;

    res.send(sr.resources(process.env.PHRASES_COLLECTION, phrase.url).update(phrase));
});

module.exports = router;
