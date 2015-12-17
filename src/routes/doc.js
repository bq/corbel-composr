'use strict'

var engine = require('../lib/engine')
var ComposrError = require('../lib/ComposrError')

module.exports = function (server) {
  server.get('/doc/:domain', function (req, res, next) {
    var domain = req.params.domain || ''
    // TODO move to core
    var rawPhrases = engine.composr.data.phrases
    var domainPhrases = rawPhrases.filter(function (item) {
      return item.id.split('!')[0] === domain
    })

    engine.composr.documentation(domainPhrases, domain)
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
  })
}
