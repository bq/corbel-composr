'use strict'
var hub = require('../lib/hub')
var transactions = require('./transactions')
var newrelic
/* *********************************
  Newrelic events
**********************************/

function createNRTransaction (item) {
  return new Promise(function (resolve, reject) {
    newrelic.createWebTransaction(item.url, function (transaction) {
      if (transaction.segments) {
        var promises = transaction.segments.map(createNRTransaction)
        Promise.all(promises)
          .then(resolve)
      } else {
        Object.keys(transaction).forEach(function (attribute) {
          newrelic.addCustomParameter(attribute, transaction.hasOwnProperty(attribute) ? transaction[attribute] : 'undefined attribute')
        })
        newrelic.endTransaction()
        return resolve()
      }
    })(item)
  })
}

function notifyTransaction (transactionId) {
  var transaction = transactions.getTransactionById(transactionId)
  createNRTransaction(transaction)
    .then(function () {
      newrelic.endTransaction()
      transactions.deleteTransactionById(transactionId)
    })
}

function initMetrics (config, logger) {
  if (config('newrelic') === true) {
    newrelic = require('newrelic')
    logger.info('Initializing NewRelic events...')

    hub.on('server:start', function () {
      newrelic.recordCustomEvent('server:start', {
        date: Date.now()
      })
    })

    hub.on('rabbitmq:error', function (err) {
      newrelic.recordCustomEvent('rabbitmq:error', {
        date: Date.now(),
        err: err
      })
    })

    hub.on('http:status', function (status, url, method) {
      newrelic.recordCustomEvent('http:status', {
        url: url,
        status: status,
        method: method
      })
    })

    hub.on('http:end', function (req, res) {
      var domain = req.url.match(/((?!\/).+:\w+)/)
      // @TODO: check if req.domain is setted by some middleware.
      var evtData = {
        guid: req.getId(),
        url: req.url,
        time: req.time(),
        startDate: req.date(),
        endDate: Date.now(),
        status: res.statusCode,
        method: req.method,
        domain: (domain && domain[0] ? domain[0] : 'domain:not:found'),
        isError: (res.statusCode.toString().indexOf('4') === 0 || res.statusCode.toString().indexOf('5') === 0),
        type: 'ROOT'
      }

      transactions.addSegment(req.getId(), evtData)
      notifyTransaction(req.getId())
    })

    hub.on('metrics:add:segment', function (evt) {
      transactions.addSegment(evt.guid, evt)
    })

    hub.on('metrics', function (domain, options) {
      newrelic.recordCustomEvent('client:metrics', {
        domain: domain,
        data: options
      })
    })

    hub.on('http:start', function (reqId) {
      newrelic.setIgnoreTransaction(true)
      transactions.addTransaction(reqId)
    })
  }
}

module.exports = initMetrics
