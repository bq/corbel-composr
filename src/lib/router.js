'use strict'
var hub = require('./hub')
var connection = require('./corbelConnection')
var engine = require('./engine')
var ComposrError = require('./ComposrError')
var logger = require('../utils/composrLogger')
var config = require('./config')
var pmx = require('pmx')
var allowedVerbs = ['get', 'put', 'post', 'delete']

/* ************************************
  Metrics
*************************************/
var probe = pmx.probe()

var counterPhrasesBeingExecuted = probe.counter({
  name: 'phrases_in_execution'
})

var counterPhrasesExecuted = probe.counter({
  name: 'phrases_executed'
})

/**
 * [extractDomainFromId description]
 * @param  {[type]} id [description]
 * @return {[type]}    [description]
 */
function extractDomainFromId (id) {
  return id.split('!')[0]
}

/**
 * [analyzePhrase description]
 * @param  {[type]} acc [description]
 * @return {[type]}     [description]
 */
function analyzePhrase (acc) {
  return function (item) {
    var domain = extractDomainFromId(item.id)

    allowedVerbs.forEach(function (verb) {
      if (item[verb]) {
        // Restify doesn't use delete it uses 'del' for storing the delete callback
        var restifyMappedVerb = verb === 'delete' ? 'del' : verb

        acc.push({
          restifyVerb: restifyMappedVerb,
          verb: verb,
          domain: domain,
          path: item.url,
          id: item.id
        })
      }
    })
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
  var params = {
    corbelDriver: req.corbelDriver,
    req: req,
    res: res,
    next: next,
    browser: true,
    timeout: config('phrases.timeout'),
    server: 'restify'
  }

  // Metrics for number of phrases executed
  counterPhrasesExecuted.inc()
  // Metrics for number of phrases being executed
  counterPhrasesBeingExecuted.inc()

  return engine.composr.Phrases.runById(routeItem.domain, routeItem.id, routeItem.verb, params)
    .then(function (response) {
      return next()
    })
    .catch(function (err) {
      logger.error('Failing executing Phrase', err)
      res.send(404, new ComposrError('endpoint:not:found', 'Not found', 404))
      return next()
    })
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
 * [authCorbelHook description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function authCorbelHook (req, res, next) {
  var authorization = req.headers.authorization

  var corbelDriver = connection.getTokenDriver(authorization, true)

  // var caller = req.params.name || 'caller'
  // req.log.debug('caller is "%s"', caller)

  req.corbelDriver = corbelDriver

  return next()
}

/**
 * [postExecutionHook description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function postExecutionHook () {
  // Metric for counterPhrasesBeingExecuted,
  // after execution decrease number.
  counterPhrasesBeingExecuted.dec()
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

      server[item.restifyVerb](url,
        authCorbelHook,
        function (req, res, next) {
          executePhraseById(req, res, next, item)
        }, postExecutionHook)

      // Support also v1.0 paths for the moment
      server[item.restifyVerb]('/v1.0' + url,
        authCorbelHook,
        function (req, res, next) {
          executePhraseById(req, res, next, item)
        }, postExecutionHook)
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
  logger.debug('GET paths:')
  server.router.routes.GET.forEach(
    function (value) {
      logger.info(value.spec.path)
    }
  )
  logger.debug('PUT paths:')
  server.router.routes.PUT.forEach(
    function (value) {
      logger.info(value.spec.path)
    }
  )
  logger.debug('POST paths:')
  server.router.routes.POST.forEach(
    function (value) {
      logger.info(value.spec.path)
    }
  )
}

module.exports = function (server) {
  hub.on('create:routes', function (phrases) {
    logger.debug('=========== CREATING ENDPOINTS ROUTES ===========')

    if (!Array.isArray(phrases)) {
      phrases = [phrases]
    }

    createRoutes(phrases, function (routeObjects) {
      bindRoutes(server, routeObjects)
      if (config('env') === 'development') {
        listAllRoutes(server)
      }
    })
  })

  hub.once('create:staticRoutes', function (server) {
    logger.info('=========== CREATING STATIC ROUTES ===========')
    require('../routes')(server)
  })

  hub.on('remove:route', function (url) {
    logger.debug('=========== REMOVE ROUTE ===========', url)
  })

  hub.once('load:worker', function () {
    logger.debug('=========== LOAD WORKER ===========')
  })
}
