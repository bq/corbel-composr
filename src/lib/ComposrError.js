'use strict'

var ComposrError = function (error, description, status) {
  var err = new Error(error)
  Object.setPrototypeOf(err, ComposrError.prototype)

  // set properties specific to the custom error
  err.status = status
  err.error = error
  err.errorDescription = description

  return err
}

ComposrError.prototype = Object.create(Error.prototype, {
  name: {
    value: 'ComposrError',
    enumerable: false
  }
})

module.exports = ComposrError
