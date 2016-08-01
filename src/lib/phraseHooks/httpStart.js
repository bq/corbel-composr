'use strict'
var hub = require('../hub')

module.exports = function () {
  return function httpStart (req, res, next) {
    hub.emit('http:start', req.getHref(), req.method, req.getId())
    return next()
  }
}
