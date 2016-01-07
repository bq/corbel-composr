/* ************************************
  Cookies
**************************************/
'use strict'

var CookieParser = require('restify-cookies')

module.exports = function (server) {
  server.use(CookieParser.parse)
}
