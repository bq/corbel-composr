'use strict';

var bootstrap = require('./bootstrap'),
    worker = require('./worker'),
    routes = require('../routes'),
    logger = require('../utils/logger'),
    q = require('q');

//Add necesary middlewares to express
function middlewares(app){
  app.use(routes.base);
  app.use(bootstrap.router);
  app.use(worker.router);
  app.use(routes.phrase);
  app.use(routes.doc);
}

//Call necesary init functions
function init(app){
  var dfd = q.defer();

  worker.init();
  
  q.all([bootstrap.phrases(), bootstrap.snippets()])
    .then(function(){
      logger.info('Engine initialized, all data is loaded :)');
      dfd.resolve(app);
    })
    .catch(dfd.reject);

  return dfd.promise;
}

module.exports = {
  init : init,
  middlewares : middlewares
};
