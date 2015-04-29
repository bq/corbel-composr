'use strict';

/* jshint proto: true */

//polyfil
Object.setPrototypeOf = Object.setPrototypeOf || function(obj, proto) {
    obj.__proto__ = proto;
    return obj;
};

//custom error
var ComposerError = function(message, params) {
    var err = new Error(message);
    Object.setPrototypeOf(err, ComposerError.prototype);

    //set properties specific to the custom error
	params = params || {};
    err.status = params.status;

    return err;
};

ComposerError.prototype = Object.create(Error.prototype, {
    name: {
        value: 'ComposerError',
        enumerable: false
    }
});

module.exports = ComposerError;
