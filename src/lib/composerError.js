'use strict';

/* jshint proto: true */

//polyfil
Object.setPrototypeOf = Object.setPrototypeOf || function(obj, proto) {
    obj.__proto__ = proto;
    return obj;
};

//custom error
var ComposerError = function(error, description, status) {
    var err = new Error(error);
    Object.setPrototypeOf(err, ComposerError.prototype);

    //set properties specific to the custom error
    err.status = status;
    err.error = error;
    err.errorDescription = description;

    return err;
};

ComposerError.prototype = Object.create(Error.prototype, {
    name: {
        value: 'ComposerError',
        enumerable: false
    }
});

module.exports = ComposerError;
