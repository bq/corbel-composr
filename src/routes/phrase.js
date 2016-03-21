'use strict'

var BaseResource = require('./BaseResource.endpoint')
var engine = require('../lib/engine')

var Phrase = new BaseResource({
  collection: engine.phrasesCollection,
  itemName: 'phrase',
  manager: engine.composr.Phrase
})

/**
 *
 * Meta-Endpoint for compoSR phrases
 * req.route.path => '/apps-sandbox/login'
 * domain => 'apps-sandbox'
 * phrasePath => 'login'
 */
module.exports = {
  loadRoutes: function (server) {
    server.put('/phrase', function (req, res, next) {
      Phrase.upsert(req, res, next)
    })

    server.put('/v1.0/phrase', function (req, res, next) {
      Phrase.upsert(req, res, next)
    })

    server.del('/phrase/:itemId', function (req, res, next) {
      Phrase.delete(req, res, next)
    })

    server.del('/v1.0/phrase/:itemId', function (req, res, next) {
      Phrase.delete(req, res, next)
    })

    server.get('/phrase/:itemId', function (req, res, next) {
      Phrase.get(req, res, next)
    })

    server.get('/v1.0/phrase/:itemId', function (req, res, next) {
      Phrase.get(req, res, next)
    })
    server.get('/phrase', function (req, res) {
      Phrase.getAll(req, res)
    })

    server.get('/v1.0/phrase', function (req, res) {
      Phrase.getAll(req, res)
    })
  },
  Phrase: Phrase
}
