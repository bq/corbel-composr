'use strict';
var hub = require('./hub'),
  connection = require('./corbelConnection'),
  engine = require('./engine'),
  ComposrError = require('./ComposrError'),
  logger = require('../utils/composrLogger'),
  config = require('./config');

var allowedVerbs = ['get', 'put', 'post', 'delete'];


/**
 * [extractDomainFromId description]
 * @param  {[type]} id [description]
 * @return {[type]}    [description]
 */
function extractDomainFromId(id) {
  return id.split('!')[0];
}

/**
 * [analyzePhrase description]
 * @param  {[type]} acc [description]
 * @return {[type]}     [description]
 */
function analyzePhrase(acc) {
  return function(item) {
    var domain = extractDomainFromId(item.id);

    allowedVerbs.forEach(function(verb) {

      if (item[verb]) {
        //Restify doesn't use delete it uses 'del' for storing the delete callback
        var restifyMappedVerb = verb === 'delete' ? 'del' : verb;

        acc.push({
          restifyVerb: restifyMappedVerb,
          verb: verb,
          domain: domain,
          path: item.url,
          id: item.id
        });
      }
    });
  };

}

/**
 * [executePhraseById description]
 * @param  {[type]}   req       [description]
 * @param  {[type]}   res       [description]
 * @param  {Function} next      [description]
 * @param  {[type]}   routeItem [description]
 * @return {[type]}             [description]
 */
function executePhraseById(req, res, next, routeItem) {
  var params = {
    corbelDriver: req.corbelDriver,
    req: req,
    res: res,
    next: next,
    browser: true,
    timeout: config('phrases.timeout'),
    server: 'restify'
  };

  return engine.composr.Phrases.runById(routeItem.domain, routeItem.id, routeItem.verb, params)
    .catch(function(err) {
      logger.error('Failing executing Phrase', err);
      res.send(404, new ComposrError('endpoint:not:found', 'Not found', 404));
    });
}

/**
 * [createRoutes description]
 * @param  {[type]}   phrases [description]
 * @param  {Function} next    [description]
 * @return {[type]}           [description]
 */
function createRoutes(phrases, next) {
  var routeObjects = [];
  phrases.forEach(analyzePhrase(routeObjects));
  next(routeObjects);
}

/**
 * [authCorbelMiddleWare description]
 * @param  {[type]}   req  [description]
 * @param  {[type]}   res  [description]
 * @param  {Function} next [description]
 * @return {[type]}        [description]
 */
function authCorbelMiddleWare(req, res, next) {

  var authorization = req.headers.authorization;

  var corbelDriver = connection.getTokenDriver(authorization, true);

  // var caller = req.params.name || 'caller';
  // req.log.debug('caller is "%s"', caller);

  req.corbelDriver = corbelDriver;

  return next();
}

/**
 * Add End-Points to Restify Router
 * @param  {[type]} server       [description]
 * @param  {[type]} routeObjects [description]
 * @return {[type]}              [description]
 */
function bindRoutes(server, routeObjects) {

  for (var i = routeObjects.length - 1; i >= 0; i--) {

    (function(item) {
      var url = '/' + item.domain + '/' + item.path;

      server[item.restifyVerb](url,
        authCorbelMiddleWare,
        function(req, res, next) {
          executePhraseById(req, res, next, item);
        });
    })(routeObjects[i]);

  }
}


/**
 * List All End-points registered in
 * Restify Router.
 * @param  {[type]} server [description]
 * @return {[type]}        [description]
 */
function listAllRoutes(server) {
  logger.debug('GET paths:');
  server.router.routes.GET.forEach(
    function(value) {
      logger.info(value.spec.path);
    }
  );
  logger.debug('PUT paths:');
  server.router.routes.PUT.forEach(
    function(value) {
      logger.info(value.spec.path);
    }
  );
  logger.debug('POST paths:');
  server.router.routes.POST.forEach(
    function(value) {
      logger.info(value.spec.path);
    }
  );
}



module.exports = function(server) {

  hub.on('create:routes', function(phrases) {

    logger.debug('=========== CREATING ENDPOINTS ROUTES ===========');

    if (!Array.isArray(phrases)) {
      phrases = [phrases];
    }

    createRoutes(phrases, function(routeObjects) {
      bindRoutes(server, routeObjects);
      if (config('env') === 'development') {
        listAllRoutes(server);
      }
    });

  });

  hub.once('create:staticRoutes', function(server) {
    logger.info('=========== CREATING STATIC ROUTES ===========');
    require('../routes')(server);
  });

  hub.on('remove:route', function(url) {
    logger.debug('=========== REMOVE ROUTE ===========', url);
  });

  hub.once('load:worker', function() {
    logger.debug('=========== LOAD WORKER ===========');
  });

};
