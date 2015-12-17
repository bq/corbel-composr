'use strict'

var config = require('../lib/config')
var engine = require('../lib/engine')
var https = require('https')
var packageJSON = require('../../package.json')
var _ = require('lodash')

function status (req, res) {
  var phrasesLoaded = engine.composr.Phrases.count()

  var statuses = {
    'phrases': phrasesLoaded > 0,
    'phrasesLoaded': phrasesLoaded,
    'worker': engine.getWorkerStatus()
  }

  var modules = ['iam', 'resources']
  var path = config('corbel.driver.options').urlBase

  var promises = modules.map(function (module) {
    return new Promise(function (resolve, reject) {
      https.get(path.replace('{{module}}', module) + '/version', function () {
        statuses[module] = true
        resolve()
      })
        .on('error', function () {
          statuses[module] = false
          reject()
        })
    })
  })

  Promise.all(promises)
    .then(function () {
      res.send({
        version: packageJSON.version,
        statuses: statuses
      })
    })
}

module.exports = function (server) {
  server.get('/', function (req, res) {
    res.send({
      title: 'Composing your phrases',
      version: packageJSON.version
    })
  })

  server.get('/version', function (req, res) {
    var picked = _.pick(packageJSON, ['name', 'description', 'version', 'build.version', 'build.date'])

    picked['corbel-js'] = packageJSON.dependencies['corbel-js']
    picked['composr-core'] = packageJSON.dependencies['composr-core']

    res.send(picked)
  })

  server.get('/status', status)

  server.get('/healthcheck', status)
}
