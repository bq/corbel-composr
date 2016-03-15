'use strict'

var engine = require('../lib/engine')
var sizeof = require('object-sizeof')
var pmx = require('pmx')
var hub = require('../lib/hub')

/* *********************************
  Keymetrics events
**********************************/

function initMetrics (config, logger) {
  if (config('keymetrics') === true) {
    logger.info('Initializing Keymetrics probes...')

    var probe = pmx.probe()

    var counterPhrasesBeingExecuted = probe.counter({
      name: 'phrases_in_execution'
    })

    var counterPhrasesExecuted = probe.counter({
      name: 'phrases_executed'
    })

    hub.on('phrase:execution:start', function (domain, id, method) {
      // Metrics for number of phrases executed
      counterPhrasesExecuted.inc()
      // Metrics for number of phrases being executed
      counterPhrasesBeingExecuted.inc()
    })

    hub.on('phrase:execution:end', function (status, domain, id, method) {
      // Metrics for number of phrases being executed
      counterPhrasesBeingExecuted.dec()
    })

    hub.on('http:status', function (status, url, method) {
      pmx.emit('http:status', {
        url: url,
        status: status,
        method: method
      })
    })

    probe.metric({
      name: 'Realtime loaded phrases count',
      agg_type: 'max',
      value: function () {
        return engine.composr.Phrase.count()
      }
    })

    probe.metric({
      name: 'Realtime loaded phrases size',
      agg_type: 'max',
      value: function () {
        return sizeof(engine.composr.Phrase.getPhrases())
      }
    })

    pmx.action('get:phrases', {
      comment: 'Return all the phrases'
    }, function (reply) {
      reply({
        phrases: engine.composr.Phrase.getPhrases()
      })
    })

    hub.on('metrics', function (domain, options) {
      pmx.emit(domain, options)
    })

    hub.on('snippet:upsert', function (domain, id) {
      pmx.emit('snippet:upsert', {
        domain: domain,
        id: id
      })
    })

    hub.on('phrase:upsert', function (domain, id) {
      pmx.emit('phrase:upsert', {
        domain: domain,
        id: id
      })
    })
  }
}

module.exports = initMetrics
