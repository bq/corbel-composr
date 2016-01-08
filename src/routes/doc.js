'use strict'

var engine = require('../lib/engine')
var ComposrError = require('../lib/ComposrError')

module.exports = function (server) {

  server.get('/doc/:domain/', serveDocumentation)
  server.get('/doc/:domain/:version/', serveDocumentation)

  function serveDocumentation(req, res, next) {
    var domain = req.params.domain || ''
    // TODO move to core
    var rawPhrases = engine.composr.data.phrases
    var phrases = rawPhrases.filter(function (item) {
      return item.id.split('!')[0] === domain
    })

    var version = req.params.version
    if (version) {
      phrases = phrases.filter(function (item) {
        return item.id.split('!')[1] === version
      })
    }

    engine.composr.documentation(phrases, domain, version || '')
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
