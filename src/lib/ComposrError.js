'use strict';

/* jshint proto: true */

//polyfil
Object.setPrototypeOf = Object.setPrototypeOf || function(obj, proto) {
    obj.__proto__ = proto;
    return obj;
};

//custom error
var ComposrError = function(error, description, status) {
    var err = new Error(error);
    Object.setPrototypeOf(err, ComposrError.prototype);

    //set properties specific to the custom error
    err.status = status;
    err.error = error;
    err.errorDescription = description;

    return err;
};

ComposrError.prototype = Object.create(Error.prototype, {
    name: {
        value: 'ComposrError',
        enumerable: false
    }
});

module.exports = ComposrError;
