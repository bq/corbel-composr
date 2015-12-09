/*************************************
  HTTP Middleware
**************************************/

'use strict';
module.exports = function(restify, server, logger) {
  /*************************************
    Allows you to add in handlers
    that run before routing occurs
  **************************************/

  // The plugin checks whether the user agent is curl.
  // If it is, it sets the Connection header to "close"
  // and removes the "Content-Length" header.
  server.pre(restify.pre.userAgentConnection());

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
  // More info here: https://github.com/restify/node-restify/issues/664
  restify.CORS.ALLOW_HEADERS.push('Accept-Encoding');
  restify.CORS.ALLOW_HEADERS.push('Accept-Language');
  restify.CORS.ALLOW_HEADERS.push('authorization');

  server.use(restify.CORS());
  server.use(restify.fullResponse());
  // https://gist.github.com/nparsons08/baf1cd43bebd93dcf325
  // server.opts(/\.*/, function(req, res, next) {
  //   res.send(200);
  //   next();
  // });

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

  logger.info(' - HTTP Middlewares loaded');

};
