'use strict';

var validator = require('./validate'),
    ComposrError = require('./ComposrError');

var getAuth = function(req) {
	validator.isValue(req, 'undefined:req');

    var auth = req.header('Authorization');

    if (!auth) {
        throw new ComposrError('missing:header:authorization', 'Authorization header not found', 401);
    }

    return auth;
};

module.exports.getAuth = getAuth;
