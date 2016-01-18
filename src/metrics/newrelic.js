'use strict'
var hub = require('../lib/hub')

/* *********************************
  Keymetrics events
**********************************/

function initMetrics (config, logger) {
  if (config('newrelic') === true) {
    var newrelic = require('newrelic')
    logger.info('Initializing NewRelic events...')

    hub.on('http:status', function (status, url, method) {
      newrelic.recordCustomEvent('http:status', {
        url: url,
        status: status,
        method: method
      })
    })

    hub.on('metrics', function (domain, options) {
      newrelic.recordCustomEvent('client:metrics', {
        domain: domain,
        data: options
      })
    })
  }
}

module.exports = initMetrics
