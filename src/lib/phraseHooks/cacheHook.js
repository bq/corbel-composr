'use strict'

var cacheModule = require('../modules/cache')
var logger = require('../../utils/composrLogger')

module.exports = function (phraseModel, verb) {
  return function (req, res, next) {
    var authHeader = req.header('Authorization')
    var path = req.getHref()

    if (!req.header('Ignore-Cache') && phraseModel.json[verb].cache && verb === 'get') {
      logger.debug('Cache', 'Requesting to cache...')

      cacheModule.get(path, verb, authHeader)
        .then(function (response) {
          if (response) {
            logger.debug('Cache', 'Found item, sending to client')
            res.send(parseInt(response.status, 10), JSON.parse(response.body))
            return
          }
          return next()
        })
    } else {
      return next()
    }
  }
}
