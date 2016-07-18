'use strict'

var cacheModule = require('../modules/cache')
var logger = require('../../utils/composrLogger')

module.exports = function (phraseModel, verb) {
  return function (req, res, next) {
    var authHeader = req.header('Authorization')
    var path = req.getHref()

    if (!req.header('Ignore-Cache') && phraseModel.json[verb].cache && verb === 'get') {
      logger.debug('[Cache-Hook]', 'Requesting to cache...')

      cacheModule.get(path, verb, authHeader, phraseModel.getVersion())
        .then(function (response) {
          if (response) {
            logger.debug('[Cache-Hook]', 'Found item, sending to client')

            try {
              res.send(parseInt(response.status, 10), response.body)
            } catch (e) {
              console.log(e)
            }
            return
          }
          logger.debug('[Cache-Hook]', 'Not Found item... continuing')
          return next()
        })
    } else {
      return next()
    }
  }
}
