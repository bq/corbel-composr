'use strict';
var hub = require('./hub'),
  connection = require('./corbelConnection'),
  engine = require('./engine'),
  ComposrError = require('./ComposrError'),
  logger = require('../utils/logger');

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

function executePhraseById(routeItem) {
  return function(req, res, next) {
    var authorization = req.get('Authorization');

    var corbelDriver = connection.getTokenDriver(authorization, true);

    logger.info('executing phrase: ',routeItem);

    var params = {
      req: req,
      res: res,
      next: next,
      corbelDriver: corbelDriver,
      browser: true,
      timeout: 10000 //TODO: load from config
    };

    return engine.composr.Phrases.runById(routeItem.domain, routeItem.id, routeItem.verb, params)
      .catch(function(err) {
        logger.error(err);
        res.status(404).send(new ComposrError('endpoint:not:found', 'Not found', 404));
      });
  };
}

function createRoutes(phrases, next) {
  var routeObjects = [];
  phrases.forEach(analyzePhrase(routeObjects));
  next(routeObjects);
  //bindRoutes(routeObjects);
}

function bindRoutes(server, routeObjects) {

  for (var i = routeObjects.length - 1; i >= 0; i--) {
    //var url = '/'+routeObjects[i].domain+'/'+routeObjects[i].path;
    var url = '/'+routeObjects[i].path.toLowerCase();
    //server[routeObjects[i].restifyVerb]('/'+routeObjects[i].domain+'/'+routeObjects[i].path, executePhraseById(routeObjects[i]));

    server[routeObjects[i].restifyVerb]({
      path : url
    },function(req,res,next){
      res.send(200);
    });

    /*server[routeObjects[i].restifyVerb]('/'+routeObjects[i].path, function(req , res, next){
      console.log('macagaoooasdasdsa');
      res.send('prestiputacion');
    });*/
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

    server.pre(function(req,res,next){
      logger.debug('Request to: ',req.url);
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
