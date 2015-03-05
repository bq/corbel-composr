'use strict';
/* jshint evil:true */

function loadPhrase(router, phrase) {
    router[phrase.method.toLowerCase()]('/' + phrase.url, function() {
        var f = new Function('req', 'res', 'sr', phrase.code);
        f();
    }).bind(router);
}

module.exports = loadPhrase;
