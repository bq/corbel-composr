'use strict';

/* jshint evil:true */

var validate = require('./validate'),
    commonCode = require('./commonCode');

var registerPhrase = function(router, phrase) {
    validate.isValue(router, 'undefined:router');
    validate.isValue(phrase, 'undefined:phrase');

    var url = phrase.id.replace(':', '/');

    ['get', 'post', 'put', 'delete', 'options'].forEach(function(method) {
        if (phrase[method]) {
            router[method]('/' + url, new Function('req', 'res', 'next', commonCode.get() + phrase[method].code));
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
