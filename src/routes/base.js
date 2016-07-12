'use strict'

var engine = require('../lib/engine')
var redisConnector = require('../lib/connectors/redis')
var corbelConnector = require('../lib/connectors/corbel')
var packageJSON = require('../../package.json')
var _ = require('lodash')

function checkServerStatus (req, res) {
  var domain = req.params.domain || null
  var phrases = engine.composr.Phrase.getPhrases(domain)

  var version = req.params.version
  if (version) {
    phrases = phrases.filter(function (item) {
      return item.getVersion() === version
    })
  }

  var phrasesLoaded = phrases.length
  var domains = _.uniq(phrases.map(function (item) {
    return item.getDomain()
  }))

  var serverStatus = {
    env: process.env.NODE_ENV || 'development',
    domains: domains,
    domain: req.params.domain,
    version: packageJSON.version,
    statuses: {
      'phrases': phrasesLoaded > 0,
      'phrasesLoaded': phrasesLoaded,
      'worker': engine.getWorkerStatus()
    }
  }

  var promises = [redisConnector.checkState, corbelConnector.checkState]

  return Promise.all(promises)
    .then(function (results) {
      serverStatus.redis = results[0]
      serverStatus.corbel = results[1]
      return serverStatus
    })
    .catch(function () {
      return serverStatus
    })
}

function status (req, res) {
  return checkServerStatus(req, res)
    .then(function (serverStatus) {
      res.send(200, serverStatus)
    })
}

function healthcheck (req, res) {
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
  server.get('/status/:domain/:version/', status)

  server.get('/healthcheck/', healthcheck)
  server.get('/healthcheck/:domain/', healthcheck)
  server.get('/healthcheck/:domain/:version/', healthcheck)
}
