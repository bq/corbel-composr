'use strict'

var hub = require('../lib/hub')
var logger = require('../utils/composrLogger')

/*
 * entityName = Phrase, entityManager = engine.composr.Phrases
 */
module.exports = function (entityName, entityManager) {
  hub.on(entityName + ':saved', function (id) {
    logger.debug(entityName + ' saved', id)

    return entityManager.load(id)
      .then(function (result) {
        logger.info(entityName + ' registered', id, result.registered)
      })
      .catch(function (err) {
        logger.error(entityName + ' error while registering: ', err.data.error, err.data.errorDescription, err.status)
      })
  })

  hub.on(entityName + ':deleted', function (id) {
    logger.debug(entityName + ' deleted', id)

    return entityManager.unregister(id)
      .then(function (result) {
        logger.info(entityName + ' unregistered', id)
      })
      .catch(function (err) {
        logger.error(entityName + ' error while unregistering: ', err.data.error, err.data.errorDescription, err.status)
      })
  })
}
