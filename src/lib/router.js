'use strict'
var hub = require('./hub')
var connection = require('./corbelConnection')
var engine = require('./engine')
var logger = require('../utils/composrLogger')
var config = require('./config')
var allowedVerbs = ['get', 'put', 'post', 'delete']

/* *
 * [analyzePhrase description]
 * @param  {[type]} acc [description]
 * @return {[type]}     [description]
 */
function analyzePhrase (acc) {
  return function (phraseModel) {
    var domain = phraseModel.getDomain()

    allowedVerbs.forEach(function (verb) {
      if (phraseModel.hasVerb(verb)) {
        // Restify doesn't use delete it uses 'del' for storing the delete callback
        var restifyMappedVerb = verb === 'delete' ? 'del' : verb

        acc.push({
          restifyVerb: restifyMappedVerb,
          verb: verb,
          domain: domain,
          path: phraseModel.getUrl(),
          id: phraseModel.getId()
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
  var params = executionMode({
    corbelDriver: req.corbelDriver,
    req: req,
    res: res,
    next: next,
    browser: true,
    timeout: config('phrases.timeout'),
    server: 'restify'
  })

  hub.emit('phrase:execution:start', routeItem.domain, routeItem.id, routeItem.verb)

  return engine.composr.Phrases.runById(routeItem.domain, routeItem.id, routeItem.verb, params)
    .then(function (response) {
      enforceGC()
      hub.emit('phrase:execution:end', response.status, routeItem.domain, routeItem.id, routeItem.verb)
      return next()
    })
    .catch(function (err) {
      if (err === 'phrase:cant:be:runned') {
        err = new engine.composr.ComposrError('endpoint:not:found', 'Endpoint not found', 404)
      }
      var parsedErr = engine.composr.parseToComposrError(err.body || err, 'internal:server:error:endpoint:execution')

      if (err.status || err.statusCode) {
        parsedErr.status = err.status || err.statusCode
        parsedErr.statusCode = parsedErr.status
      }

      logger.debug(err)
      logger.error('Failing executing Phrase', parsedErr.status, routeItem.domain, routeItem.id)
      // @TODO: log error in metrics

      hub.emit('phrase:execution:end', parsedErr.status, routeItem.domain, routeItem.id, routeItem.verb)
      return next(parsedErr)
    })
}

/**
 * Set composr-core execution phrases with Node VM
 * @param  {Object} params execution configuration
 * @return {Object} modified execution params
 */
function executionMode (params) {
  if (config('execution.vm')) {
    params.browser = false
  }

  return params
}

/**
 * Enforce run Garbage Collector every phrase execution
 * @return {[type]} [description]
 */
function enforceGC () {
  if (config('execution.gc') && !!global.gc) {
    global.gc()
  }
}

/**
 * [createRoutes description]
 * @param  {[type]}   phrases [description]
 * @param  {Function} next    [description]
 * @return {[type]}           [description]
 */
function createRoutes (virtualDomainModel, phrases, next) {
  var routeObjects = []
  var analyze = analyzePhrase(routeObjects)

  phrases.forEach(function (phraseModel) {
    analyze(phraseModel)
  })

  next(virtualDomainModel, routeObjects)
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
function bindRoutes (server, virtualDomainModel, restifyPhrasesMapper) {
  for (var i = restifyPhrasesMapper.length - 1; i >= 0; i--) {
    (function (item) {
      var url = '/' + item.domain + '/' + item.path

      // TODO insert virtualDomainModel.getMiddlewares()

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
    })(restifyPhrasesMapper[i])
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
  hub.on('create:routes', function (virtualDomainModel) {
    logger.debug('Creting or updating endpoints...')

    var domain = virtualDomainModel.getDomain()
    var apiId = virtualDomainModel.getApiId()
    var phraseModels = engine.composr.Phrases.getPhrases(domain, apiId)

    createRoutes(virtualDomainModel, phraseModels, function (virtualDomainModel, restifyPhrasesMapper) {
      bindRoutes(server, virtualDomainModel, restifyPhrasesMapper)
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
