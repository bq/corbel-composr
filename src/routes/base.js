'use strict'

var config = require('../lib/config')
var engine = require('../lib/engine')
var https = require('https')
var packageJSON = require('../../package.json')
var _ = require('lodash')

function checkServerStatus(req, res) {
  var domain = req.params.domain
  var apiId = req.params.apiId
  var version = req.params.version

  var phrases = engine.composr.Phrases.getAll()

  if (domain) {
    phrases = phrases.filter(function (phrase) {
      return phrase.domain === domain
    })
  }
  if (apiId) {
    phrases = phrases.filter(function (phrase) {
      return phrase.apiId === apiId
    })
  }
  if (version) {
    phrases = phrases.filter(function (phrase) {
      return phrase.version === version
    })
  }

  var phrasesLoaded = phrases.length
  var domains = _.uniq(phrases.map(function (phrase) {
    return phrase.domain;
  }))

  var serverStatus = {
    env: config('env'),
    domains: domains,
    domain: req.params.domain,
    version: packageJSON.version,
    statuses: {
      'phrases': phrasesLoaded > 0,
      'phrasesLoaded': phrasesLoaded,
      'worker': engine.getWorkerStatus()
    }
  }

  var modules = ['iam', 'resources', 'assets', 'evci']
  var path = config('corbel.driver.options').urlBase

  var promises = modules.map(function (module) {
    return new Promise(function (resolve) {
      // Remove the version (v1.0) from the urlBase and add '/version'
      var versionPath = path.replace(new RegExp('(.*/)[^/]+/?$'), '$1')
          .replace('{{module}}', module) + '/version'

      https.get(versionPath, function (res) {
        serverStatus.statuses[module] = Math.floor(res.statusCode / 100) === 2
        resolve()
      })
        .on('error', function () {
          serverStatus.statuses[module] = false
          resolve()
        })
    })
  })

  return Promise.all(promises)
    .then(function () {
      return serverStatus
    })
    .catch(function () {
      return serverStatus
    })
}

function status(req, res) {
  return checkServerStatus(req, res)
    .then(function (serverStatus) {
      res.send(200, serverStatus)
    })
}

function healthcheck(req, res) {
  return checkServerStatus(req, res)
    .then(function (serverStatus) {
      var errors = _.filter(serverStatus.statuses, function (status) {
        return !status === true
      })

      if (errors.length > 0) {
        res.send(500, serverStatus)
      } else {
        res.send(200, serverStatus)
      }
    })
}

module.exports = function (server) {
  server.get('/', function (req, res) {
    res.send(200, {
      title: 'Composing your phrases',
      version: packageJSON.version
    })
  })

  server.get('/version', function (req, res) {
    var picked = _.pick(packageJSON, ['name', 'description', 'version', 'build.version', 'build.date'])

    picked['corbel-js'] = packageJSON.dependencies['corbel-js']
    picked['composr-core'] = packageJSON.dependencies['composr-core']

    res.send(200, picked)
  })

  server.get('/status', status)
  server.get('/status/:domain/', status)
  server.get('/status/:domain/:apiId', status)
  server.get('/status/:domain/:apiId/:version', status)

  server.get('/healthcheck', healthcheck)
  server.get('/healthcheck/:domain', healthcheck)
  server.get('/healthcheck/:domain/:apiId', healthcheck)
  server.get('/healthcheck/:domain/:apiId/:version', healthcheck)
}
