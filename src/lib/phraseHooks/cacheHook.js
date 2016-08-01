'use strict'

var cacheModule = require('../modules/cache')
var logger = require('../../utils/composrLogger')
var hub = require('../hub')
var engine = require('../engine')

module.exports = function (phraseModel, verb) {
  if (engine.services.redis) {
    return function cacheHook (req, res, next) {
      var authHeader = req.header('Authorization')
      var path = req.getHref()

      if (!req.header('Ignore-Cache') && phraseModel.json[verb].cache && verb === 'get') {
        logger.debug('[Cache-Hook]', 'Requesting to cache...')

        cacheModule.get(path, verb, authHeader, phraseModel.getVersion())
          .then(function (response) {
            if (response) {
              logger.debug('[Cache-Hook]', 'Found item, sending to client')

              try {
                hub.emit('phrase:cache:hit', path)
                res.send(parseInt(response.status, 10), response.body)
                hub.emit('http:end', req, res)
              } catch (e) {
                logger.error('[Cache-Hook]', 'Error sending response', e)
              }
              return
            }
            hub.emit('phrase:cache:miss', path)
            logger.debug('[Cache-Hook]', 'Not Found item... continuing')
            return next()
          })
      } else {
        return next()
      }
    }
  } else {
    return null
  }
}
