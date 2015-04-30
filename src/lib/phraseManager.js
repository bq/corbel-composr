'use strict';

/* jshint evil:true */

var validate = require('./validate'),
    corbel = require('corbel-js'),
    config = require('../config/config.json'),
    phrases = require('./phrasesData'),
    tripwire = require('tripwire'),
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

    var url = phrase.id.replace(/!/g, '/');

    ['get', 'post', 'put', 'delete', 'options'].forEach(function(method) {
        if (phrase[method]) {
            console.log('Registering ' + method.toUpperCase() + ' ' + url);
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

                // set the limit of execution time to 2000 milliseconds
                tripwire.resetTripwire(config.timeout || 10000);

                var funct = new Function('req', 'res', 'next', 'corbelDriver', phrase[method].code);
                var args = [req, res, next, corbelDriver];

                funct.apply(null, args);

                // clear the tripwire (in this case this code is never reached)
                tripwire.clearTripwire();

            });
        }
    });
};

var unregisterPhrase = function(router, phrase) {
    validate.isValue(router, 'undefined:router');
    validate.isValue(phrase, 'undefined:phrase');
    validate.isValue(phrase.id, 'undefined:phrase:id');

    var domain = phrase.id.split('!')[0];
    var url = '/' + phrase.id.replace(/!/g, '/');

    // remove from express
    var i = 0;
    while (i < router.stack.length) {
        if (router.stack[i].route.path === url) {
            router.stack.splice(i, 1);
        } else {
            i++;
        }
    }

    // remove from internal data
    var exists = _.findIndex(phrases.list[domain], function(item) {
        return item.id === phrase.id;
    });

    if (exists !== -1) {
        phrases.list[domain].splice(exists, 1);
    }
};

var getPhrases = function(domain) {
    return phrases.list[domain];
};

module.exports.registerPhrase = registerPhrase;
module.exports.unregisterPhrase = unregisterPhrase;
module.exports.getPhrases = getPhrases;
