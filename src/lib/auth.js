'use strict';

var validator = require('./validate'),
    ComposerError = require('./composerError');

var getAuth = function(req) {
	validator.isValue(req, 'undefined:req');

    var auth = req.get('Authorization');

    if (!auth) {
        throw new ComposerError('missing:header:authorization', 'Authorization header not found', 401);
    } 

    return auth;
};

module.exports.getAuth = getAuth;
