'use strict';

/* jshint evil:true */

var validate = require('./validate'),
    corbel = require('corbel-js'),
    config = require('../config/config.json'),
    phrases = require('./phrases'),
    _ = require('underscore');

var registerPhrase = function(router, phrase) {
    validate.isValue(router, 'undefined:router');
    validate.isValue(phrase, 'undefined:phrase');

    var domain = phrase.id.split('!')[0];
    phrases.list[domain] = phrases.list[domain] || [];

    var exists = _.findIndex(phrases.list[domain], function(item) {
        return item.id === phrase.id;
    });

    if (exists !== -1) {
        phrases.list[domain][exists] = phrase;
    } else {
        phrases.list[domain].push(phrase);
    }

    var url = phrase.id.replace('!', '/');

    ['get', 'post', 'put', 'delete', 'options'].forEach(function(method) {
        if (phrase[method]) {
            router[method]('/' + url, function(req, res, next) {

                var iamToken = req.get('Authorization') || undefined;
                if (iamToken) {
                    iamToken = {
                        'accessToken': iamToken.replace('Bearer ', '')
                    };
                }

                var corbelConfig = config['corbel.driver.options'];
                corbelConfig.iamToken = iamToken;

                var corbelDriver = corbel.getDriver(corbelConfig);

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
