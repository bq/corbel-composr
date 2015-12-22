'use strict'

var engine = require('./engine')
var sizeof = require('object-sizeof')
var pmx = require('pmx')

/* *********************************
  Metrics
**********************************/

function initMetrics () {
  var probe = pmx.probe()

  probe.metric({
    name: 'Realtime loaded phrases count',
    agg_type: 'max', // jshint ignore : line
    value: function () {
      return engine.composr.Phrases.count()
    }
  })

  probe.metric({
    name: 'Realtime loaded phrases size',
    agg_type: 'max', // jshint ignore : line
    value: function () {
      return sizeof(engine.composr.Phrases.getPhrases())
    }
  })

  pmx.action('get:phrases', {
    comment: 'Return all the phrases'
  }, function (reply) {
    reply({
      phrases: engine.composr.Phrases.getPhrases()
    })
  })
}

module.exports = initMetrics
