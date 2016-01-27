'use strict'

var config = require('../lib/config')
var engine = require('../lib/engine')
var https = require('https')
var packageJSON = require('../../package.json')
var phraseUtils = require('../utils/phraseUtils')
var _ = require('lodash')

function checkServerStatus (req, res) {
  var phrases = engine.composr.data.phrases

  var domain = req.params.domain
  if (domain) {
    phrases = phrases.filter(function (item) {
      return phraseUtils.extractDomainFromId(item.id) === domain
    })
  }

  var version = req.params.version
  if (version) {
    phrases = phrases.filter(function (item) {
      return item.id.split('!')[1] === version
    })
  }

  var phrasesLoaded = phrases.length
  var domains = _.uniq(phrases.map(function(item){
    return phraseUtils.extractDomainFromId(item.id)
  }));

  var serverStatus = {
    env: config('env'),
    domains: domains,
    domain: req.params.domain,
    version: packageJSON.version,
    statuses: {
      'phrases': phrasesLoaded > 0,
      'phrasesLoaded': phrasesLoaded,
      'worker': engine.getWorkerStatus(),
    }
  }

  var modules = ['iam', 'resources']
  var path = config('corbel.driver.options').urlBase

  var promises = modules.map(function (module) {
    return new Promise(function (resolve) {
      https.get(path.replace('{{module}}', module) + '/version', function () {
        serverStatus.statuses[module] = true
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
