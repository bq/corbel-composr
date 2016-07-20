'use strict'

var engine = require('../lib/engine')
var sizeof = require('object-sizeof')
var pmx = require('pmx')
var hub = require('../lib/hub')

/* *********************************
  Keymetrics events
**********************************/

function initMetrics (config, logger) {
  if (config.get('keymetrics') === true) {
    logger.info('[Keymetrics]', 'Initializing Keymetrics probes...')

    var probe = pmx.probe()

    var counterPhrasesBeingExecuted = probe.counter({
      name: 'phrases_in_execution'
    })

    var counterPhrasesExecuted = probe.counter({
      name: 'phrases_executed'
    })

    var counterPhrasesUpdated = probe.counter({
      name: 'phrases_updated'
    })

    var counterSnippetsUpdated = probe.counter({
      name: 'snippets_updated'
    })

    var counterVirtualDomainsUpdated = probe.counter({
      name: 'virtualdomains_updated'
    })

    /* *******************************************
      PHRASES METRICS
    **********************************************/
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

    // Emited inside phrases.
    hub.on('metrics', function (domain, options) {
      pmx.emit(domain, options)
    })

    /* *******************************************
      HTTP METRICS
    **********************************************/
    hub.on('http:status', function (status, url, method) {
      pmx.emit('http:status', {
        url: url,
        status: status,
        method: method
      })
    })

    hub.on('http:start', function (url, method) {
      pmx.emit('http:start', {
        url: url,
        method: method
      })
    })

    hub.on('http:end', function (req, res) {
      pmx.emit('http:end', {
        url: req.getHref(),
        method: req.method
      })
    })

    hub.on('phrase:cache:hit', function (url) {
      counterSnippetsUpdated.inc()
      pmx.emit('phrase:cache:hit', {
        url: url
      })
    })

    hub.on('phrase:cache:miss', function (url) {
      counterSnippetsUpdated.inc()
      pmx.emit('phrase:cache:miss', {
        url: url
      })
    })

    /* *******************************************
      CRUD ENDPOINTS METRICS
    **********************************************/

    hub.on('virtualdomain:upsert', function (domain, id) {
      counterVirtualDomainsUpdated.inc()
      pmx.emit('virtualdomain:upsert', {
        domain: domain,
        id: id
      })
    })

    hub.on('snippet:upsert', function (domain, id) {
      counterSnippetsUpdated.inc()
      pmx.emit('snippet:upsert', {
        domain: domain,
        id: id
      })
    })

    hub.on('phrase:upsert', function (domain, id) {
      counterPhrasesUpdated.inc()
      pmx.emit('phrase:upsert', {
        domain: domain,
        id: id
      })
    })

    hub.on('phrase:delete', function (domain, id) {
      counterPhrasesUpdated.inc()
      pmx.emit('phrase:delete', {
        domain: domain,
        id: id
      })
    })

    hub.on('snippet:delete', function (domain, id) {
      counterSnippetsUpdated.inc()
      pmx.emit('snippet:delete', {
        domain: domain,
        id: id
      })
    })
  }
}

module.exports = initMetrics
