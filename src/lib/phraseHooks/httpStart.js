'use strict'
var hub = require('../hub')

module.exports = function () {
  return function (req, res, next) {
    hub.emit('http:start', req.getHref(), req.method, req.getId())
    return next()
  }
}
