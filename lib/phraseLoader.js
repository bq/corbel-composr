'use strict';
/* jshint evil:true */

function loadPhrase(router, phrase) {
    router[phrase.method.toLowerCase()]('/' + phrase.url, function(req, res) {
    	console.log(req, res);
        var f = new Function('req', 'res', 'sr', phrase.code);
        f();
    }).bind(router);
}

module.exports = loadPhrase;
