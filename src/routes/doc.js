'use strict'

var engine = require('../lib/engine')
var ComposrError = require('../lib/ComposrError')
var raml2html = require('raml2html')


module.exports = function (server) {
  server.get('/doc/:domain/:apiId/', serveDocumentation)
  server.get('/snippets/:domain/:apiId', snippetsDoc)

  //TODO:
  //server.get('/doc/:domain/:apiId/:version', serveDocumentation)
  //server.get('/snippets/:domain/:apiId/:version', snippetsDoc)

  function serveDocumentation(req, res, next) {
    var vdomainId = req.params.domain + '!' + req.params.apiId

    return engine.composr.VirtualDomain.loadById(vdomainId)
      .then(function (virtualDomain) {
        return ramlToHtml(virtualDomain._apiRaml)
      })
      .then(function (html) {
        res.writeHead(200, {
          'Content-Length': Buffer.byteLength(html),
          'Content-Type': 'text/html'
        })
        res.write(result)
        res.end()
      })
      .catch(function (err) {
        next(new ComposrError('error:phrase:doc', 'Error generating doc: ' + err, 422))
      })
  }

  function snippetsDoc(req, res, next) {
    var vdomainId = req.params.domain + '!' + req.params.apiId

    return engine.composr.Snippets.loadByVirtualDomain(vdomainId)
      .then(function (snippets) {
        return snippetsToHtml(snippets)
      })
      .then(function (html) {
        res.writeHead(200, {
          'Content-Length': Buffer.byteLength(html),
          'Content-Type': 'text/html'
        })
        res.write(result)
        res.end()
      })
      .catch(function (err) {
        next(new ComposrError('error:snippet:doc', 'Error generating doc: ' + err, 422))
      })
  }

  var ramlToHtml = function (raml) {
    return raml2html.render(raml, raml2html.getDefaultConfig())
  }

  //TODO: Refactor this
  var snippetsToHtml = function (snippets) {
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
    return body
  }

  var noSnippetsTemplate = '<div class="alert alert-info">No snippets for domain {0}</div>'
  var titleTemplate = '<h1>Domain {0}</h1>'
  var bootstrap = '<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" ' +
    'integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">'

  var titleRow =
    '<tr class="success">' +
    '<th>' + 'Snippet' + '</th>' +
    '<th>' + 'Last updated' + '</th>' +
    '</tr>'

  function row(snippet) {
    return '<tr>' +
      '<td>' + snippet.id.split('!')[1] + '</td>' +
      '<td>' + new Date(snippet._updatedAt) + '</td>' +
      '</tr>'
  }
}
