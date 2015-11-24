'use strict';
var bunyan = require('bunyan');
/*************************************
  Server Config and Load
**************************************/
var restify = require('restify'),
  hub = require('./lib/hub'),
  server = restify.createServer({
    name: 'Corbel-Composr',
    log: bunyan.createLogger({
      name: 'Corbel-Composr',
      streams: [{
        level: 'debug',
        stream: process.stdout // log INFO and above to stdout
      }, {
        level: 'error',
        path: './logs/api-error.log' // log ERROR and above to a file
      }, {
        level: 'trace',
        path: './logs/api.log'
      }],
      serializers: restify.bunyan.serializers
    })
  });
require('./lib/router')(server);

var engine = require('./lib/engine'),
  WorkerClass = require('./lib/worker'),
  //ComposrError = require('./lib/ComposrError'),
  config = require('./lib/config'),
  configChecker = require('./utils/envConfigChecker');

var worker = new WorkerClass();

//var ERROR_CODE_SERVER_TIMEOUT = 503;
// var DEFAULT_TIMEOUT = '10s';

/*************************************
  Allows you to add in handlers
  that run before routing occurs
**************************************/

// The plugin checks whether the user agent is curl.
// If it is, it sets the Connection header to "close"
// and removes the "Content-Length" header.
server.pre(restify.pre.userAgentConnection());

/*************************************
  Logs
**************************************/
var logger = require('./utils/logger');
//Custom log


// if (config('accessLog') === true || config('accessLog') === 'true') {
//   // Access log, logs http requests
//   var accessLogStream = fs.createWriteStream(config('accessLogFile'), {
//     flags: 'a'
//   });

//   /*server.use(morgan('combined', {
//     stream: accessLogStream
//   }));*/
// }
server.pre(function(request, response, next) {
  request.log.info({
    req: request
  }, 'start'); // (1)
  return next();
});

server.on('after', function(req, res, route) {
  req.log.info({
    res: res,
    route: route
  }, 'finished'); // (3)
});

/*************************************
  New Relic
**************************************/
if (config('newrelic') === true || config('newrelic') === 'true') {
  //require('newrelic');
}

/*************************************
  Configuration check
**************************************/
var env = process.env.NODE_ENV || 'development';
configChecker.checkConfig(env);


/**************************************
  Body Parser
**************************************/

server.use(restify.bodyParser({
  maxBodySize: 0,
  mapParams: false
}));

/*************************************
  Cors
**************************************/
server.use(restify.CORS());

/*************************************
  Accept Parser
  content types the server knows how to respond to
**************************************/
server.use(restify.acceptParser(server.acceptable));


/*************************************
  Query Parser
**************************************/
server.use(restify.queryParser({
  mapParams: false
}));


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
hub.emit('create:staticRoutes',server);

module.exports = engine.init(server);
