'use strict'
var hub = require('./hub')
var engine = require('./engine')
var logger = require('../utils/composrLogger')
var config = require('config')
var allowedVerbs = ['get', 'put', 'post', 'delete']
var phraseHooks = require('./phraseHooks')
var _ = require('lodash')
var yn = require('yn')

/* *
 * [analyzePhrase description]
 * @param  {[type]} acc [description]
 * @return {[type]}     [description]
 */
function analyzePhrase (acc) {
  return function (phraseModel) {
    var domain = phraseModel.getDomain()

    allowedVerbs.forEach(function (verb) {
      if (phraseModel.canRun(verb)) {
        // Restify doesn't use delete it uses 'del' for storing the delete callback
        var restifyMappedVerb = verb === 'delete' ? 'del' : verb

        acc.push({
          restifyVerb: restifyMappedVerb,
          verb: verb,
          domain: domain,
          path: phraseModel.getUrl(),
          version: phraseModel.getVersion(),
          id: phraseModel.getId(),
          phrase: phraseModel
        })
      }
    })
  }
}

function doCheckCache (routeItem, response, path, authorization) {
  if (routeItem.phrase.json[routeItem.verb].middlewares && routeItem.phrase.json[routeItem.verb].middlewares.indexOf('cache') !== -1) {
    var options = routeItem.phrase.json[routeItem.verb].cache

    switch (routeItem.verb) {
      case 'get':
        hub.emit('cache-add', path, routeItem.verb, authorization, routeItem.phrase.getVersion(), response, options)
        break
      default:
        // Another request deletes the 'get' path cache
        hub.emit('cache-remove', path, 'get', authorization, routeItem.phrase.getVersion(), routeItem.domain, options)
    }
  }
}

/**
 * [executePhraseById description]
 * @param  {[type]}   req       [description]
 * @param  {[type]}   res       [description]
 * @param  {Function} next      [description]
 * @param  {[type]}   routeItem [description]
 * @return {[type]}             [description]
 */
function executePhraseById (req, res, next, routeItem) {
  var params = executionMode({
    corbelDriver: req.corbelDriver,
    req: req,
    res: res,
    next: next,
    browser: true,
    timeout: config.get('execution.timeout'),
    server: 'restify',
    userId: req.userId
  })

  hub.emit('phrase:execution:start', routeItem.domain, routeItem.id, routeItem.verb)

  return engine.composr.Phrase.runById(routeItem.id, routeItem.verb, params)
    .then(function (response) {
      enforceGC()
      hub.emit('phrase:execution:end', response.status, routeItem.domain, routeItem.id, routeItem.verb)
      doCheckCache(routeItem, response, req.getHref(), req.header('Authorization'))
      return next()
    })
    .catch(function (err) {
      console.log('CATCHED ERR', err)
      if (err === 'phrase:cant:be:runned') {
        err = new engine.composr.ComposrError('endpoint:not:found', 'Endpoint not found', 404)
      }

      var parsedErr = engine.composr.parseToComposrError(err.body || err, 'internal:server:error:endpoint:execution')

      if (err.status || err.statusCode) {
        parsedErr.status = err.status || err.statusCode
        parsedErr.statusCode = parsedErr.status
      }

      logger.debug('[Router]', _.pick(err, ['status', 'data']))
      logger.error('[Router]', 'Failing executing Phrase', parsedErr.status, routeItem.domain, req.getHref())
      // @TODO: log error in metrics

      hub.emit('phrase:execution:end', parsedErr.status, routeItem.domain, routeItem.id, routeItem.verb)

      if (res.headersSent) {
        return next()
      } else {
        // Shortcut for res.send if the phrase hasn't handled it
        return next(parsedErr)
      }
    })
}

/**
 * Set composr-core execution phrases with Node VM
 * @param  {Object} params execution configuration
 * @return {Object} modified execution params
 */
function executionMode (params) {
  if (yn(config.get('execution.vm'))) {
    params.browser = false
  }

  return params
}

/**
 * Enforce run Garbage Collector every phrase execution
 * @return {[type]} [description]
 */
function enforceGC () {
  if (yn(config.get('execution.gc')) && !!global.gc) {
    global.gc()
  }
}

/**
 * [createRoutes description]
 * @param  {[type]}   phrases [description]
 * @param  {Function} next    [description]
 * @return {[type]}           [description]
 */
function createRoutes (phrases, next) {
  var routeObjects = []
  phrases.forEach(analyzePhrase(routeObjects))
  next(routeObjects)
}

/**
 * Add End-Points to Restify Router
 * @param  {[type]} server       [description]
 * @param  {[type]} routeObjects [description]
 * @return {[type]}              [description]
 */
function bindRoutes (server, routeObjects) {
  for (var i = routeObjects.length - 1; i >= 0; i--) {
    (function (item) {
      var url = '/' + item.domain + '/' + item.path

      // Mandatory hooks
      var corbelDriverSetupHook = phraseHooks.get('corbel-driver-setup')
      var metricsHook = phraseHooks.get('metrics')
      // User-defined hooks
      var hooks = phraseHooks.getHooks(item.phrase, item.verb)

      var args = [{
        path: url,
        version: item.version
      }]

      if (hooks) {
        args = args.concat(hooks)
      }
      args = args.concat(corbelDriverSetupHook)
      args = args.concat(metricsHook)
      args = args.concat(function bindRoute (req, res, next) {
        executePhraseById(req, res, next, item)
      })

      server[item.restifyVerb].apply(server, args)
    })(routeObjects[i])
  }
}

/**
 * List All End-points registered in
 * Restify Router.
 * @param  {[type]} server [description]
 * @return {[type]}        [description]
 */
function listAllRoutes (server) {
  logger.debug('[Router]', 'GET paths:')
  server.router.routes.GET.forEach(
    function (value) {
      logger.info(value.spec.path)
    }
  )
  logger.debug('[Router]', 'PUT paths:')
  server.router.routes.PUT.forEach(
    function (value) {
      logger.info(value.spec.path)
    }
  )
  logger.debug('[Router]', 'POST paths:')
  server.router.routes.POST.forEach(
    function (value) {
      logger.info(value.spec.path)
    }
  )
}

module.exports = function (server) {
  hub.on('create:routes', function (phrases) {
    logger.debug('[Router]', 'Creting or updating endpoints...')

    if (!Array.isArray(phrases)) {
      phrases = [phrases]
    }

    createRoutes(phrases, function (routeObjects) {
      bindRoutes(server, routeObjects)
    })
  })

  hub.once('create:staticRoutes', function (server) {
    logger.info('[Router]', 'Creating static routes...')
    require('../routes')(server)
  })

  hub.on('remove:route', function (url) {
    logger.debug('[Router]', 'Remove route:', url)
    // Restify doesn't support removing routes on the fly, instead return a 404
    listAllRoutes()
  })
}
