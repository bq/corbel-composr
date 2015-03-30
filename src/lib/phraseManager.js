'use strict';

/* jshint evil:true */

var validate = require('./validate'),
    corbel = require('corbel-js'),
    config = require('../config/config.json');

var registerPhrase = function(router, phrase) {
    validate.isValue(router, 'undefined:router');
    validate.isValue(phrase, 'undefined:phrase');

    var url = phrase.id.replace(':', '/');

    ['get', 'post', 'put', 'delete', 'options'].forEach(function(method) {
        if (phrase[method]) {
            router[method]('/' + url, function(req, res, next) {

                var iamToken = req.get('Authorization') || undefined;
                if (iamToken) {
                    iamToken = {
                        'accessToken': iamToken.replace('Bearer ', '')
                    };
                }

                var corbelConfig = config['composr.corbel.options'];

                var corbelDriver = corbel.getDriver({
                    resourcesEndpoint: corbelConfig.resourcesEndpoint,
                    iamEndpoint: corbelConfig.iamEndpoint,
                    IamToken: iamToken
                });

                var funct = new Function('req', 'res', 'next', 'corbelDriver', phrase[method].code);
                var args = [req, res, next, corbelDriver];

                return funct.apply(null, args);
            });
        }
    });
};

var unregisterPhrase = function(router, url) {
    validate.isValue(router, 'undefined:router');
    validate.isValue(url, 'undefined:url');

    var i = 0;
    while (i < router.stack.length) {
        if (router.stack[i].route.path === url) {
            router.stack.splice(i, 1);
        } else {
            i++;
        }
    }
};

module.exports.registerPhrase = registerPhrase;
module.exports.unregisterPhrase = unregisterPhrase;
