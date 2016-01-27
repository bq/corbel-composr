'use strict'
var hub = require('./hub')
var connection = require('./corbelConnection')
var engine = require('./engine')
var logger = require('../utils/composrLogger')
var config = require('./config')
var allowedVerbs = ['get', 'put', 'post', 'delete']
var ComposrError = require('./ComposrError')
var phraseUtils = require('../utils/phraseUtils')

/* *
 * [analyzePhrase description]
 * @param  {[type]} acc [description]
 * @return {[type]}     [description]
 */
function analyzePhrase (acc) {
  return function (item) {
    var domain = phraseUtils.extractDomainFromId(item.id)

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

  hub.emit('phrase:execution:start', routeItem.domain, routeItem.id, routeItem.verb)

  return engine.composr.Phrases.runById(routeItem.domain, routeItem.id, routeItem.verb, params)
    .then(function (response) {
      hub.emit('phrase:execution:end', response.status, routeItem.domain, routeItem.id, routeItem.verb)
      return next()
    })
    .catch(function (err) {
      if (err === 'phrase:cant:be:runned') {
        err = new ComposrError('endpoint:not:found', 'Endpoint not found', 404)
      }

      logger.error('Failing executing Phrase', err)
      // @TODO: log error in metrics
      var status = typeof err === 'object' ? err.status || err.statusCode : 404
      hub.emit('phrase:execution:end', status, routeItem.domain, routeItem.id, routeItem.verb)
      return next(err)
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
  if (config('composrLog.logLevel') === 'debug') {
    corbelDriver.on('request', function () {
      logger.debug('>>> corbelDriver request: ', arguments)
    })
  }

  req.corbelDriver = corbelDriver

  return next()
}

/**
 * Add custom metrics parameters in req before running phrase
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */

function initReqParams (req, res, next) {
  hub.emit('http:start', req.getId())
  req.corbelDriver.on('service:request:after', corbelDriverEventHookAfter(req))
  return next()
}

/**
 * Forward corbel driver events to corbel-composer event hub
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */

function corbelDriverEventHookAfter (req) {
  return function hook (evt) {
    var evtData = {
      guid: req.getId(),
      startDate: req.date(),
      endDate: Date.now(),
      url: evt.response.request.href,
      status: evt.response.statusCode,
      method: evt.response.req.method,
      time: req.time(),
      isError: (evt.response.statusCode.toString().indexOf('4') === 0 || evt.response.statusCode.toString().indexOf('5') === 0),
      type: 'EXTERNAL'
    }
    hub.emit('metrics:add:segment', evtData)
  }
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
        initReqParams,
        function bindRoute (req, res, next) {
          executePhraseById(req, res, next, item)
        })

      // Support also v1.0 paths for the moment
      server[item.restifyVerb]('/v1.0' + url,
        authCorbelHook,
        initReqParams,
        function bindRouteV1 (req, res, next) {
          executePhraseById(req, res, next, item)
        })
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
    logger.debug('Creting or updating endpoints...')

    if (!Array.isArray(phrases)) {
      phrases = [phrases]
    }

    createRoutes(phrases, function (routeObjects) {
      bindRoutes(server, routeObjects)
    })
  })

  hub.once('create:staticRoutes', function (server) {
    logger.info('Creating static routes...')
    require('../routes')(server)
  })

  hub.on('remove:route', function (url) {
    logger.debug('=========== REMOVE ROUTE ===========', url)
    // Restify doesn't support removing routes on the fly, instead return a 404
    listAllRoutes()
  })
}
