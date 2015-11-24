'use strict';

var restify = require('restify'),
  server = restify.createServer({name:'Corbel-Composr'});

  require('./lib/router')(server);
  //bunyan = require('bunyan'),
  var engine = require('./lib/engine'),
  WorkerClass = require('./lib/worker'),
  ComposrError = require('./lib/ComposrError'),
  config = require('./lib/config'),
  configChecker = require('./utils/envConfigChecker');

var worker = new WorkerClass();

var ERROR_CODE_SERVER_TIMEOUT = 503;
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
// var logger = require('./utils/logger');
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


/*************************************
  Load Routes
**************************************/
//require('./routes')(server);


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
server.use(restify.urlEncodedBodyParser());

server.use(restify.bodyParser({
    maxBodySize: 50
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
server.use(restify.queryParser());


/*************************************
  Error handlers
**************************************/

/// catch 404 and forward to error handler
var NotFoundHandler = function(req, res, next) {
  next(new ComposrError('error:not_found', 'Not Found', 404));
};

//server.use(NotFoundHandler);

var errorHandler = function(err, req, res, next) {

  var message = err.error || err.message || err;
  if (message === 'Error caught by express error handler') {
    message = 'error:internal';
  }

  var status = err.status || 500;
  if (err.timeout || message === 'Blocked event loop.') {
    message = 'error:timeout';
    status = ERROR_CODE_SERVER_TIMEOUT;
  }

  var errorLogged = {
    status: status,
    error: message,
    errorDescription: err.errorDescription || '',
    // development error handler
    // will print stacktrace
    trace: (server.get('env') === 'development' ? err.stack : '')
  };

  //logger.error(errorLogged);
  res.status(status);
  res.send(errorLogged);

  next(err);
};

//server.use(errorHandler);

//server.use(pmx.expressErrorHandler());

process.on('uncaughtException', function(err) {
  //logger.debug('Error caught by uncaughtException', err);
  //logger.error(err);
  if (!err || err.message !== 'Can\'t set headers after they are sent.') {
    process.exit(1);
  }
});

//Trigger the worker execution
worker.init();

module.exports = engine.init(server);
