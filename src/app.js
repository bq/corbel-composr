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
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// 404 handler
app.use(function(req, res, next) {
    res.status(404);

    // respond with html page
    if (req.accepts('html')) {
        res.render('404', {
            url: req.url
        });
        return;
    }

    // respond with json
    if (req.accepts('json')) {
        res.send({
            error: 'not_found',
            errorDescription: 'Not found'
        });
        return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
    next();
});

/// error handlers
var errorHandler = function(err, req, res, next) {
    var status = err.status || 500;
    res.status(status);
    res.json({
        httpStatus: status,
        error: err.message,
        // development error handler
        // will print stacktrace
        trace: (app.get('env') === 'development' ? err : {})
    });
    next();
};
app.use(errorHandler);

module.exports = app;
