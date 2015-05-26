'use strict';

var bootstrap = require('./bootstrap'),
    worker = require('./worker'),
    routes = require('../routes');

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
  bootstrap.phrases();
  bootstrap.snippets();
  worker.init();
  middlewares(app);
}


module.exports = {
  init : init
};
