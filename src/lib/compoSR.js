'use strict';

var bootstrap = require('./bootstrap'),
    worker = require('./worker'),
    snippetsBundler = require('./snippetsBundler'),
    routes = require('../routes');

//Add necesary middlewares to express
function middlewares(app){
  app.use(routes.base);
  app.use(bootstrap.router);
  app.use(worker.router);
  app.use(routes.phrase);
  app.use(routes.doc);

  if(app.get('env') === 'development') {
    app.use(routes.test);
  }
}

//Call necesary init functions
function init(app){
  bootstrap.phrases();
  bootstrap.snippets();
  worker.init();
  middlewares(app);
}

/**
 Returns the snippets runner for being embebed into the phrases executions
 //TODO: instead of instantiting under demand, pregenerate that bundles
**/
function getSnippetsRunner(domain){
  console.log('OBJTAAINI');
  var bundle = snippetsBundler.bundle(bootstrap.getSnippets(), domain);
  return {
    run: function(funcName, params){
      return bundle[funcName](params);
    }
  };
}


module.exports = {
  init : init,
  getSnippetsRunner: getSnippetsRunner
};
