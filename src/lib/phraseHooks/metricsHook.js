'use strict'
var hub = require('../hub')

module.exports = function () {
  return function (req, res, next) {
    hub.emit('http:start', req.getId())
    req.corbelDriver.on('service:request:after', corbelDriverEventHookAfter(req))
    return next()
  }
}

/**
 * Forward corbel driver events to corbel-composer event hub
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */

function corbelDriverEventHookAfter (req) {
  return function hook (evt) {
    var evtData = {
      guid: req.getId(),
      startDate: req.date(),
      endDate: Date.now(),
      url: evt.response.request.href,
      status: evt.response.statusCode,
      method: evt.response.req.method,
      time: req.time(),
      isError: (evt.response.statusCode.toString().indexOf('4') === 0 || evt.response.statusCode.toString().indexOf('5') === 0),
      type: 'EXTERNAL'
    }
    hub.emit('metrics:add:segment', evtData)
  }
}
