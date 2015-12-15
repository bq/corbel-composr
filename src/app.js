/*************************************
  Server Config and Load
**************************************/
'use strict';

var restify = require('restify');
var hub = require('./lib/hub');
var srvConf = require('./config/server');
var server = restify.createServer(srvConf);
require('./lib/router')(server);
var engine = require('./lib/engine');
var WorkerClass = require('./lib/worker');
var config = require('./lib/config');
var configChecker = require('./utils/envConfigChecker');
var worker = new WorkerClass();
var logger = require('./utils/logger');

/*************************************
  Configuration check
**************************************/
var env = process.env.NODE_ENV || 'development';
configChecker.checkConfig(env);


/*************************************
  Error handlers
**************************************/
logger.info('Loading Middlewares...');
require('./middlewares')(restify,server,config,logger);

/*************************************
  Error handlers
**************************************/

/// catch 404 and forward to error handler
// var NotFoundHandler = function(req, res, next) {
//   next(new ComposrError('error:not_found', 'Not Found', 404));
// };

// //server.use(NotFoundHandler);

// var errorHandler = function(req,res, next) {

//   var errorLogged = {
//     status: res.status,
//     error: res.message,
//     errorDescription: res.errorDescription || '',
//     // development error handler
//     // will print stacktrace
//     trace: (process.env.ENV === 'development' ? res.stack : '')
//   };

//   logger.error(errorLogged);

//   next(res);
// };

// server.use(errorHandler);

//server.use(pmx.expressErrorHandler());

process.on('uncaughtException', function(err) {
  logger.debug('Error caught by uncaughtException', err);
  logger.error(err);
  if (!err || err.message !== 'Can\'t set headers after they are sent.') {
    process.exit(1);
  }
});

//Trigger the worker execution
worker.init();

// Trigger the static routes creation
hub.emit('create:staticRoutes', server);

module.exports = engine.init(server);
