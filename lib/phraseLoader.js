'use strict';

/* jshint evil:true */

var registerPhrase = function(router, phrase) {
	var url = phrase.id.replace(':', '/');

    ['get', 'post', 'put', 'delete', 'options'].forEach(function(method) {
        if (phrase[method]) {
            router[method]('/' + url, new Function('req', 'res', 'sr', phrase[method].code));
        }
    });
};

// @todo
// function unregisterPhrase(router, url) {
// }

module.exports.registerPhrase = registerPhrase;
