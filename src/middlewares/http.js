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
  // If it is, it sets the Connection header to 'close'
  // and removes the 'Content-Length' header.
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
  server.use(restify.CORS());
  //server.use(restify.fullResponse());
  // Lets try and fix CORS support
  // By default the restify middleware doesn't do much unless you instruct
  // it to allow the correct headers.
  //
  // See issues:
  // https://github.com/mcavage/node-restify/issues/284 (closed)
  // https://github.com/mcavage/node-restify/issues/664 (unresolved)
  //
  // What it boils down to is that each client framework uses different headers
  // and you have to enable the ones by hand that you may need.
  // The authorization one is key for our authentication strategy
  //
  restify.CORS.ALLOW_HEADERS.push('authorization');
  restify.CORS.ALLOW_HEADERS.push('withcredentials');
  restify.CORS.ALLOW_HEADERS.push('x-requested-with');
  restify.CORS.ALLOW_HEADERS.push('x-forwarded-for');
  restify.CORS.ALLOW_HEADERS.push('x-real-ip');
  restify.CORS.ALLOW_HEADERS.push('x-customheader');
  restify.CORS.ALLOW_HEADERS.push('user-agent');
  restify.CORS.ALLOW_HEADERS.push('keep-alive');
  restify.CORS.ALLOW_HEADERS.push('host');
  restify.CORS.ALLOW_HEADERS.push('accept');
  restify.CORS.ALLOW_HEADERS.push('connection');
  restify.CORS.ALLOW_HEADERS.push('upgrade');
  restify.CORS.ALLOW_HEADERS.push('content-type');
  restify.CORS.ALLOW_HEADERS.push('dnt'); // Do not track
  restify.CORS.ALLOW_HEADERS.push('if-modified-since');
  restify.CORS.ALLOW_HEADERS.push('cache-control');

  // Manually implement the method not allowed handler to fix failing preflights
  //
  server.on('MethodNotAllowed', function(request, response) {
    if (request.method.toUpperCase() === 'OPTIONS') {
      // Send the CORS headers
      //
      response.header('Access-Control-Allow-Credentials', true);
      response.header('Access-Control-Allow-Headers', restify.CORS.ALLOW_HEADERS.join(', '));
      response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.header('Access-Control-Allow-Origin', '*');
      response.header('Access-Control-Max-Age', 0);
      response.header('Content-type', 'text/plain charset=UTF-8');
      response.header('Content-length', 0);

      response.send(204);
    } else {
      response.send(new restify.MethodNotAllowedError());
    }
  });

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
