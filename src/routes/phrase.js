'use strict';

var express = require('express'),
    corbel = require('corbel-js'),
    config = require('../config/config.json'),
    router = express.Router(),
    connection = require('../lib/corbelConnection'),
    phraseManager = require('../lib/phraseManager'),
    phraseValidator = require('../lib/phraseValidator'),
    ComposerError = require('../lib/composerError');

var getAuth = function(req) {
    var auth = req.get('Authorization');

    if (!auth) {
        throw new ComposerError('missing:header:authorization', 'Authorization header not found', 401);
    } 

    return auth;
};

/**
 * Creates or updates a phrase
 * @param  phrase:
 * {
 *     "url": "phrase1/:pathparam",
 *     "get": {
 *         "code": "",
 *         "doc": {
 *             "description": "This method will get all songs\n",
 *             "queryParameters": {
 *                 "genre": {
 *                     "description": "filter the songs by genre"
 *                 }
 *             },
 *             "responses": {
 *                 "200": {
 *                     "body": {
 *                         "application/json": {
 *                             "schema": "{ \"$schema\": \"http://json-schema.org/schema\",\n  \"type\": \"object\",\n  \"description\": \"A canonical song\",\n  \"properties\": {\n    \"title\":  { \"type\": \"string\" },\n    \"artist\": { \"type\": \"string\" }\n  },\n  \"required\": [ \"title\", \"artist\" ]\n}\n"
 *                         },
 *                         "application/xml": null
 *                     }
 *                 }
 *             }
 *         }
 *     }
 *     "post": {
 *         ...
 *     },
 *     "put": {
 *         ...
 *     },
 *     "delete": {
 *         ...
 *     }
 * }
 * @return {promise}
 */
router.put('/phrase', function(req, res) {

    var auth = getAuth(req);    

    var phrase = req.body || {};

    var corbelDriver = connection.getTokenDriver(auth);

    var domain = connection.extractDomain(auth);

    phraseValidator.validate(domain, phrase).then(function() {

        phrase.id = domain + '!' + phrase.url.replace(/\//g, '!');

        corbelDriver.resources.resource(process.env.PHRASES_COLLECTION, phrase.id).update(phrase).then(function(response) {
            res.send(response.status, response.data);
        }).catch(function(error) {
            throw new ComposerError('error:phrase:create', error.message, error.status);
        });

    }, function(error) {
        throw new ComposerError('error:phrase:validation', 'Error validating phrase: ' + error, 422);
    });

});

router.delete('/phrase/:phraseid', function(req, res) {
    var auth = getAuth(req);

    var corbelDriver = connection.getTokenDriver(auth);

    var phraseIdentifier = connection.extractDomain(auth) + '!' + req.params.phraseid;
    corbelDriver.resources.resource(process.env.PHRASES_COLLECTION, phraseIdentifier).delete().then(function(response) {
        res.send(response.status, response.data);
    }).catch(function(error) {
        throw new ComposerError('error:phrase:delete', error.message, error.status);
    });

});

router.get('/phrase/:phraseid', function(req, res) {
    var auth = getAuth(req);

    var corbelDriver = connection.getTokenDriver(auth);

    var phraseIdentifier = connection.extractDomain(auth) + '!' + req.params.phraseid;
    corbelDriver.resources.resource(process.env.PHRASES_COLLECTION, phraseIdentifier).get().then(function(response) {
        res.send(response.status, response.data);
    }).catch(function(error) {
        throw new ComposerError('error:phrase:get', error.message, error.status);
    });
});

router.get('/phrase', function(req, res) {
    var auth = getAuth(req);
    res.send(phraseManager.getPhrases(connection.extractDomain(auth)));
});

router.post('/token', function(req, res) {

    var data = req.body || {};

    var corbelConfig = config['corbel.driver.options'];

    corbelConfig.clientId = data.clientId;
    corbelConfig.clientSecret = data.clientSecret;
    corbelConfig.scopes = data.scopes;

    var corbelDriver = corbel.getDriver(corbelConfig);

    corbelDriver.iam.token().create().then(function(response) {
        res.send(response);
    }).catch(function(error) {
        throw new ComposerError('error:token', error.message, error.status);
    });

});

module.exports = router;
