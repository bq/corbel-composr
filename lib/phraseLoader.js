'use strict';
/* jshint evil:true */

function loadPhrase(router, phrase) {
    router[phrase.method.toLowerCase()]('/' + phrase.url, new Function('req', 'res', 'sr', phrase.code));
}

module.exports = loadPhrase;