'use strict';

var express = require('express'),
    corbel = require('corbel-js'),
    config = require('../config/config.json'),
    router = express.Router(),
    connection = require('../lib/corbelConnection'),
    phraseManager = require('../lib/phraseManager'),
    phraseValidator = require('../lib/phraseValidator');

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

    var auth = req.get('Authorization');

    if (!auth) {
        res.status(401).send('missing:header:authorization');
        return;
    }    

    var phrase = req.body || {};

    var corbelDriver = connection.getTokenDriver(auth);

    var domain = connection.extractDomain(auth);

    phraseValidator.validate(domain, phrase).then(function() {

        phrase.id = domain + '!' + phrase.url.replace(/\//g, '!');

        corbelDriver.resources.resource(process.env.PHRASES_COLLECTION, phrase.id).update(phrase).then(function(response) {
            res.send(response.status, response.data);
        }).catch(function(error) {
            console.error('error:phrase:create', error);
            res.send(error.status, error);
        });

    }, function(error) {
        res.status(422).send('Error validating phrase: ' + error);
    });

    corbelDriver.resources.resource(process.env.PHRASES_COLLECTION, phrase.id).update(phrase).then(function(response) {
        res.send(response.status, response.data);
    }).catch(function(error) {
        console.error('error:phrase:create', error);
        res.send(error.status, error);
    });

});

router.delete('/phrase/:phraseid', function(req, res) {
    var auth = req.get('Authorization');

    if (!auth) {
        res.status(401).send('missing:header:authorization');
        return;
    }
    var corbelDriver = connection.getTokenDriver(auth);

    var phraseIdentifier = connection.extractDomain(auth) + '!' + req.params.phraseid;
    corbelDriver.resources.resource(process.env.PHRASES_COLLECTION, phraseIdentifier).delete().then(function(response) {
        res.send(response.status, response.data);
    }).catch(function(error) {
        console.error('error:phrase:delete', error);
        res.send(error.status, error);
    });

});

router.get('/phrase/:phraseid', function(req, res) {
    var auth = req.get('Authorization');

    if (!auth) {
        res.status(401).send('missing:header:authorization');
        return;
    }
    var corbelDriver = connection.getTokenDriver(auth);

    var phraseIdentifier = connection.extractDomain(auth) + '!' + req.params.phraseid;
    corbelDriver.resources.resource(process.env.PHRASES_COLLECTION, phraseIdentifier).get().then(function(response) {
        res.send(response.status, response.data);
    }).catch(function(error) {
        console.error('error:phrase:getPhrase', error);
        res.send(error.status, error);
    });
});

router.get('/phrase', function(req, res) {
    var auth = req.get('Authorization');

    if (!auth) {
        res.status(401).send('missing:header:authorization');
        return;
    }

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
        console.error('error:token', error);
        res.send(error.status, error);
    });

});

module.exports = router;
