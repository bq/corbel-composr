'use strict';
var hub = require('./hub'),
  connection = require('./corbelConnection'),
  engine = require('./engine'),
  ComposrError = require('./ComposrError'),
  logger = require('../utils/logger'),
  restify = require('restify');

var allowedVerbs = ['get', 'put', 'post', 'delete', 'head'];

function extractDomainFromId(id) {
  return id.split('!')[0];
}

function analyzePhrase(acc) {
  return function(item) {
    var domain = extractDomainFromId(item.id);

    logger.debug(domain, item.url);

    allowedVerbs.forEach(function(verb) {

      if (item[verb]) {
        logger.debug('Verb found:', verb);
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

function executePhraseById(req, res, next, routeItem) {
  var params = {
    corbelDriver: req.corbelDriver,
    req: req,
    res: res,
    next: next,
    browser: true,
    timeout: 10000,
    server: 'restify'
  };

  return engine.composr.Phrases.runById(routeItem.domain, routeItem.id, routeItem.verb, params)
    .catch(function(err) {
      logger.error('PUTAAA', err);
      res.send(404, new ComposrError('endpoint:not:found', 'Not found', 404));
    });
}

function createRoutes(phrases, next) {
  var routeObjects = [];
  phrases.forEach(analyzePhrase(routeObjects));
  next(routeObjects);
  //bindRoutes(routeObjects);
}


function authCorbelMiddleWare(req, res, next) {

  var authorization = req.headers['authorization'];

  if (!authorization) {
    return next(new restify.InvalidArgumentError("Missing Authorization Header"));
  }

  var corbelDriver = connection.getTokenDriver(authorization, true);

  var caller = req.params.name || 'caller';
  req.log.debug('caller is "%s"', caller);

  req.corbelDriver = corbelDriver;

  return next();
}

function bindRoutes(server, routeObjects) {

  for (var i = routeObjects.length - 1; i >= 0; i--) {

    var url = '/' + routeObjects[i].domain + '/' + routeObjects[i].path;
    var routeItem = routeObjects[i];
    var verb = routeObjects[i].restifyVerb;

    server[verb]({
        path: url,
        name: routeItem.id
      },
      authCorbelMiddleWare,
      function(req, res, next) {
        executePhraseById(req, res, next, routeItem);
      });
  }
}


function listAllRoutes(server) {
  logger.debug('GET paths:');
  server.router.routes.GET.forEach(
    function(value) {
      console.log(value.spec.path);
    }
  );
  logger.debug('PUT paths:');
  server.router.routes.PUT.forEach(
    function(value) {
      console.log(value.spec.path);
    }
  );
  logger.debug('POST paths:');
  server.router.routes.POST.forEach(
    function(value) {
      console.log(value.spec.path);
    }
  );
}



module.exports = function(server) {

  hub.once('create:routes', function(phrases) {

    logger.debug('=========== CREATING ENDPOINTS ROUTES ===========');

    server.pre(function(req, res, next) {
      logger.debug('Request to: ', req.url);
      next();
    });

    createRoutes(phrases, function(routeObjects) {
      bindRoutes(server, routeObjects);
      listAllRoutes(server);
    });

    require('../routes')(server);

  });

  hub.on('remove:route', function(url) {
    logger.debug('=========== REMOVE ROUTE ===========', url);
  });

  hub.on('load:worker', function() {
    logger.debug('=========== LOAD WORKER ===========');
  });

};
