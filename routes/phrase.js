'use strict';

var express = require('express');
var router = express.Router();
var sr = require('sr');

var extractDomain = function(Authorization) {
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
	var phrase = req.params.phrase || {};

	phrase.url = extractDomain(req.get('Authorization')) + ':' + phrase.name;

    res.send(sr.resources(process.env.PHRASES_COLLECTION, phrase.url).update(phrase));
});

module.exports = router;
