'use strict';

var express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    index = require('./routes/index'),
    version = require('./routes/version'),
    phrase = require('./routes/phrase'),
    bootstrap = require('./lib/bootstrap'),
    ComposerError = require('./lib/composerError'),
    worker = require('./lib/worker'),
    cors = require('cors'),
    corbel = require('corbel-js'),
    app = express();

// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.set('corbel', corbel);

var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env === 'development';

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

app.use(index);
app.use(version);
app.use(bootstrap);
app.use(worker);
app.use(phrase);

/// catch 404 and forward to error handler
var NotFundHandler = function(req, res, next) {
    next(new ComposerError('error:not_found', 'Not Found', 404));
};
app.use(NotFundHandler);

// error handler
var errorHandler = function(err, req, res, next) {
    var status = err.status || 500;
    res.status(status);
    res.json({
        httpStatus: status,
        error: err.message,
        errorDescription: err.errorDescription || '',
        // development error handler
        // will print stacktrace
        trace: (app.get('env') === 'development' ? err.stack : '')
    });
    console.error(err);
    next();
};
app.use(errorHandler);

module.exports = app;
