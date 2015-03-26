'use strict';

var express = require('express'),
    corbel = require('corbel-js'),
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
                "id": "domain:phrase1",
                "get": {
                    "code": "",
                    "description": "",
                    "query": {
                        "param1": {
                            "type": "",
                            "description": "",
                            "default": 0
                        }
                        ...
                    },
                    "responses": {
                        "200": {
                            "body": {
                                "application/json": {
                                    "schema": {
                                        "$schema": "http://json-schema.org/schema",
                                        "type": "object",
                                        "description": "A canonical song",
                                        "properties": {
                                            "title": {
                                                "type": "String"
                                            },
                                            "artist": {
                                                "type": "String"
                                            }
                                        },
                                        "required": ["title", "artist"]
                                    }
                                }
                            }
                        }
                        ...
                    }
                }
                "post": {
                    ...
                },
                "put": {
                    ...
                },
                "delete": {
                    ...
                },
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
});

module.exports = router;
