'use strict'

var BaseResource = require('./BaseResource.endpoint')
var engine = require('../lib/engine')
var corbelConnector = require('../lib/connectors/corbel')

var Snippet = new BaseResource({
  collection: corbelConnector.SNIPPETS_COLLECTION,
  itemName: 'snippet',
  manager: engine.composr.Snippet
})

module.exports = {
  loadRoutes: function (server) {
    server.del('/snippet/:itemId', function (req, res, next) {
      Snippet.delete(req, res, next)
    })

    server.del('/v1.0/snippet/:itemId', function (req, res, next) {
      Snippet.delete(req, res, next)
    })

    server.put('/snippet', function (req, res, next) {
      Snippet.upsert(req, res, next)
    })

    server.put('/v1.0/snippet', function (req, res, next) {
      Snippet.upsert(req, res, next)
    })

    server.get('/snippet/:itemId', function (req, res, next) {
      Snippet.get(req, res, next)
    })

    server.get('/v1.0/snippet/:itemId', function (req, res, next) {
      Snippet.get(req, res, next)
    })
    server.get('/snippet', function (req, res) {
      Snippet.getAll(req, res)
    })

    server.get('/v1.0/snippet', function (req, res) {
      Snippet.getAll(req, res)
    })
  },
  Snippet: Snippet
}
