'use strict';

function loadPhrase(phrase) {
	router[phrase.method](phrase.url, function(req, res) {
		var params = [req, res, sr];
		var f = new Function(params, phrase.code);
		f();
	}).bind(router);
}

module.exports = loadPhrase;