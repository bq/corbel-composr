'use strict'

var engine = require('../lib/engine')
var ComposrError = require('../lib/ComposrError')

var noSnippetsTemplate = '<div class="alert alert-info">No snippets for domain {0}</div>'
var titleTemplate = '<h1>Domain {0}</h1>'
var bootstrap = '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" ' +
  'integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">'

module.exports = function (server) {
  server.get('/doc/:domain/', serveDocumentation)
  server.get('/doc/:domain/:version/', serveDocumentation)
  server.get('/snippets/:domain', snippetsDoc)

  function serveDocumentation (req, res, next) {
    var domain = req.params.domain || ''
    var version = req.params.version

    var phrases = engine.composr.Phrase.getPhrases(domain)

    if (version) {
      phrases = phrases.filter(function (item) {
        return item.getVersion() === version
      })
    }

    phrases = phrases.map(function (item) {
      return item.getRawModel()
    })

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

  function snippetsDoc (req, res, next) {
    var version = req.params.version
    var domain = req.params.domain || ''
    var snippets = engine.composr.Snippet.getSnippets(domain)

    if (version) {
      snippets = snippets.filter(function (item) {
        return item.getVersion() === version
      })
    }

    var body = '<html><body>' + bootstrap
    body += titleTemplate.replace('{0}', domain)

    if (snippets && snippets.length > 0) {
      body += '<table class="table table-bordered">' + titleRow
      snippets.forEach(function (snippet) {
        body += row(snippet)
      })
      body += '</table>'
    } else {
      body += noSnippetsTemplate.replace('{0}', domain)
    }

    body += '</body></html>'

    res.writeHead(200, {
      'Content-Length': Buffer.byteLength(body),
      'Content-Type': 'text/html'
    })
    res.write(body)
    res.end()
  }

  var titleRow =
  '<tr class="success">' +
    '<th>' + 'Snippet' + '</th>' +
    '<th>' + 'Last updated' + '</th>' +
    '</tr>'

  function row (snippet) {
    return '<tr>' +
    '<td>' + snippet.getName() + '</td>' +
    '<td>' + new Date(snippet.getRawModel()._updatedAt) + '</td>' +
    '</tr>'
  }
}
