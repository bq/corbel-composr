'use strict';

var express = require('express'),
    router = express.Router();

var extractDomain = function(Authorization) {
	// @todo extract domain from token
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

    // @todo integrate with sr.js
    // res.send(sr.resources(process.env.PHRASES_COLLECTION, phrase.url).update(phrase));
    res.send('new phrase!');
});

module.exports = router;
