/* ************************************
  HTTP Middleware
**************************************/

'use strict'
module.exports = function (restify, server, logger) {
  /* ************************************
    Allows you to add in handlers
    that run before routing occurs
  **************************************/

  // The plugin checks whether the user agent is curl.
  // If it is, it sets the Connection header to 'close'
  // and removes the 'Content-Length' header.
  server.pre(restify.pre.userAgentConnection())

  /* *************************************
    Body Parser
  **************************************/

  server.use(restify.bodyParser({
    maxBodySize: 0,
    mapParams: false
  }))

  /* ************************************
    Cors
  **************************************/
  server.pre(restify.CORS({
    origins: ['*'],
    credentials: true,
    headers: ['X-Requested-With', 'Authorization']
  }))

  function unknownMethodHandler (req, res) {
    if (req.method.toLowerCase() === 'options') {
      // added Origin & X-Requested-W$
      var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 'Api-Version', 'Origin', 'X-Requested-With', 'Authorization']

      if (res.methods.indexOf('OPTIONS') === -1) {
        res.methods.push('OPTIONS')
      }

      res.header('Access-Control-Allow-Credentials', true)
      res.header('Access-Control-Allow-Headers', allowHeaders.join(', '))
      res.header('Access-Control-Allow-Methods', res.methods.join(', '))
      res.header('Access-Control-Allow-Origin', req.headers.origin)

      return res.send(204)
    } else {
      return res.send(new restify.MethodNotAllowedError())
    }
  }

  server.on('MethodNotAllowed', unknownMethodHandler)

  /* ************************************
    Accept Parser
    content types the server knows how to respond to
  **************************************/
  server.use(restify.acceptParser(server.acceptable))

  /* ************************************
    Query Parser
  **************************************/
  server.use(restify.queryParser({
    mapParams: false
  }))

  logger.info(' - HTTP Middlewares loaded')
}
