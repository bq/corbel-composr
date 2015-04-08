'use strict';

var express = require('express'),
    corbel = require('corbel-js'),
    config = require('../config/config.json'),
    router = express.Router(),
    connection = require('../lib/corbelConnection');

/**
 * Creates or updates a phrase
 * @param  phrase:
 * {
 *     "id": "domain:phrase1",
 *     "get": {
 *         "code": "",
 *         "description": "",
 *         "query": {
 *             "param1": {
 *                 "type": "",
 *                 "description": "",
 *                 "default": 0
 *             }
 *             ...
 *         },
 *         "responses": {
 *             "200": {
 *                 "body": {
 *                     "application/json": {
 *                         "schema": {
 *                             "type": "object",
 *                             "description": "A canonical song",
 *                             "properties": {
 *                                 "title": {
 *                                     "type": "String"
 *                                 },
 *                                 "artist": {
 *                                     "type": "String"
 *                                 }
 *                             },
 *                             "required": ["title", "artist"]
 *                         }
 *                     }
 *                 }
 *             }
 *             ...
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

    var phrase = req.body || {};
    var auth = req.get('Authorization');

    if (!auth) {
        res.status(401).send('missing:header:authorization');
        return;
    }
    var corbelDriver = connection.getTokenDriver(auth);

    phrase.id = connection.extractDomain(auth) + '!' + phrase.id;

    corbelDriver.resources.resource(process.env.PHRASES_COLLECTION, phrase.id).update(phrase).then(function(response) {
        res.send(response.status, response.data);
    }).catch(function(error) {
        console.error('error:phrase:create', error);
        res.send(error.status, error);
    });

});

router.delete('/phrase', function(req, res) {

    var phrase = req.body || {};
    var auth = req.get('Authorization');

    if (!auth) {
        res.status(401).send('missing:header:authorization');
        return;
    }
    var corbelDriver = connection.getTokenDriver(auth);

    phrase.id = connection.extractDomain(auth) + '!' + phrase.id;

    corbelDriver.resources.resource(process.env.PHRASES_COLLECTION, phrase.id).delete().then(function(response) {
        res.send(response.status, response.data);
    }).catch(function(error) {
        console.error('error:phrase:delete', error);
        res.send(error.status, error);
    });

});

router.get('/phrase', function(req, res) {
    var auth = req.get('Authorization');

    if (!auth) {
        res.status(401).send('missing:header:authorization');
        return;
    }

    res.send(require('../lib/phrases').list[connection.extractDomain(auth)]);
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
