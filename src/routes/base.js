'use strict'

var config = require('../lib/config')
var engine = require('../lib/engine')
var https = require('https')
var packageJSON = require('../../package.json')
var _ = require('lodash')

function check (req, res) {
  var phrases = engine.composr.data.phrases

  var domain = req.params.domain
  if (domain) {
    phrases = phrases.filter(function (item) {
      return item.id.split('!')[0] === domain
    })
  }

  var version = req.params.version
  if (version) {
    phrases = phrases.filter(function (item) {
      return item.id.split('!')[1] === version
    })
  }

  var phrasesLoaded = phrases.length

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

  return Promise.all(promises)
    .then(function () {
      return statuses
    })
    .catch(function () {
      return statuses
    })
}

function status (req, res) {
  return check(req, res).then(function (statuses) {
    res.send(200, {
      version: packageJSON.version,
      domain: req.params.domain,
      statuses: statuses
    })
  })
}

function healthcheck (req, res) {
  return check(req, res).then(function (statuses) {
    var errors = _.filter(statuses, function (status) {
      return !status === true
    })

    var response = {
      version: packageJSON.version,
      domain: req.params.domain,
      statuses: statuses
    }

    if (errors.length > 0) {
      res.send(500, response)
    } else {
      res.send(200, response)
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
