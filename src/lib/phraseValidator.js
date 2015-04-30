'use strict';

/* jshint evil:true */

var validator = require('./validate'),
    check = require('syntax-error'),
    docBuilder = require('./docBuilder');

/**
 * Validates if a phrase is well formed
 * @param  {String} domain
 * @param  {Object} phrase
 * @throws {Error} If phrase is not well formed
 * @return {Promise}
 */
var validate = function(domain, phrase) {

    validator.isValue(domain, 'undefined:domain');
    validator.isValue(phrase, 'undefined:phrase');
    validator.isValue(phrase.url, 'undefined:phrase:url');

    var methodPresent = false;

    ['get', 'post', 'put', 'delete', 'options'].forEach(function(method) {
        if (phrase[method]) {
            validator.isValue(phrase[method].code, 'undefined:phrase:' + method + ':code');
            validator.isValue(phrase[method].doc, 'undefined:phrase:' + method + ':doc');

            var funct = new Function('req', 'res', 'next', 'corbelDriver', phrase[method].code);
            var error = check(funct);
            if (error) {
                throw error;
            }

            methodPresent = true;
        }
    });

    if (!methodPresent) {
        throw new Error('undefined:phrase:http_method');
    }

    return docBuilder.load(domain, phrase);
};


module.exports.validate = validate;
