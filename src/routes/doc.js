'use strict'

var engine = require('../lib/engine')
var ComposrError = require('composr-core').ComposrError

module.exports = function (server) {
  server.get('/doc/:domain/', serveDocumentation)
  server.get('/doc/:domain/:version/', serveDocumentation)

  function serveDocumentation (req, res, next) {
    var domain = req.params.domain || ''
    var version = req.params.version || ''

    var phrases = engine.composr.Phrase.getPhrases(domain)
    var snippets = engine.composr.Snippet.getSnippets(domain)

    engine.composr.documentation(phrases, snippets, domain, version || '', 'doc/' + domain)
      .then(function (result) {
        res.writeHead(200, {
          'Content-Length': Buffer.byteLength(result),
          'Content-Type': 'text/html'
        })
        res.write(result)
        res.end()
      })
      .catch(function (err) {
        next(new ComposrError('error:phrase:doc', 'Error generating doc: ' + err, 422))
      })
  }
}
