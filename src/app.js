'use strict';

var express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    morgan = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    engine = require('./lib/engine'),
    ComposerError = require('./lib/composerError'),
    config = require('./lib/config'),
    timeout = require('connect-timeout'),
    responseTime = require('response-time'),
    cors = require('cors'),
    corbel = require('corbel-js'),
    fs = require('fs'),
    app = express();

var ERROR_CODE_SERVER_TIMEOUT = 503;
var DEFAULT_TIMEOUT = 10000;

/*************************************
  Logs
**************************************/
var logger = require('./utils/logger');
//Custom log
app.set('logger', logger);

// Access log, logs http requests
var accessLogStream = fs.createWriteStream('logs/access.log', {flags: 'a'});
app.use(morgan('combined', {stream: accessLogStream}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('corbel', corbel);

var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env === 'development';

app.disable('x-powered-by');
app.use(responseTime());
app.use(favicon(__dirname + '/../public/img/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));


/*************************************
  Cors
**************************************/
app.use(cors({
    origin: function(origin, callback) {
        callback(null, true);
    },
    credentials: true
}));
app.options('*', cors());

app.use(timeout(config('timeout') || DEFAULT_TIMEOUT, {
    status: ERROR_CODE_SERVER_TIMEOUT
}));


/*************************************
  Engine middlewares
**************************************/
engine.init(app);

if(app.get('env') === 'development') {
  app.use(require('./routes/test'));
}

var haltOnTimedout = function(req, res, next) {
    if (!req.timedout) {
        next();
    }
};

app.use(haltOnTimedout);

/*************************************
  Error handlers
**************************************/

/// catch 404 and forward to error handler
var NotFundHandler = function(req, res, next) {
    next(new ComposerError('error:not_found', 'Not Found', 404));
};
app.use(NotFundHandler);

var errorHandler = function(err, req, res, next) {
    logger.debug('Error caught by express error handler', err);

    var status = err.status || 500;
    if (err.timeout) {
        status = ERROR_CODE_SERVER_TIMEOUT;
    }

    res.status(status);
    res.json({
        httpStatus: status,
        error: err.message,
        errorDescription: err.errorDescription || '',
        // development error handler
        // will print stacktrace
        trace: (app.get('env') === 'development' ? err.stack : '')
    });

    logger.error(err, err.stack);
    next(err);
};

app.use(errorHandler);

process.on('uncaughtException', function(err) {
  logger.debug('Error caught by uncaughtException', err);
  logger.error(err);
  if (!err || err.message !== 'Can\'t set headers after they are sent.') {
    process.exit(1);
  }
});

module.exports = app;
