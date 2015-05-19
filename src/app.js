'use strict';

var express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    compoSR = require('./lib/compoSR'),
    ComposerError = require('./lib/composerError'),
    config = require('./config/config'),
    timeout = require('connect-timeout'),
    responseTime = require('response-time'),
    cors = require('cors'),
    corbel = require('corbel-js'),
    app = express();

var ERROR_CODE_SERVER_TIMEOUT = 503;
var DEFAULT_TIMEOUT = 10000;

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
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// cors
app.use(cors({
    origin: function(origin, callback) {
        callback(null, true);
    },
    credentials: true
}));
app.options('*', cors());

app.use(timeout(config.timeout || DEFAULT_TIMEOUT, {
    status: ERROR_CODE_SERVER_TIMEOUT
}));

//Init compoSR middlewares
compoSR.init(app);

if(app.get('env') === 'development') {
  app.use(require('./routes/test'));
}

var haltOnTimedout = function(req, res, next) {
    if (!req.timedout) {
        next();
    }
};
app.use(haltOnTimedout);

/// catch 404 and forward to error handler
var NotFundHandler = function(req, res, next) {
    next(new ComposerError('error:not_found', 'Not Found', 404));
};
app.use(NotFundHandler);

// error handler
var errorHandler = function(err, req, res, next) {
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

    console.error(err, err.stack);
    next(err);
};

app.use(errorHandler);


process.on('uncaughtException', function(err) {
    if (!err || err.message !== 'Can\'t set headers after they are sent.') {
        process.exit(1);
    }
});

module.exports = app;
