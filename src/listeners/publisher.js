'use strict'

var hub = require('../lib/hub')

module.exports = function (composrEventHub, entityName) {
  composrEventHub.on(entityName + ':registered', 'CorbelComposr', function (entity) {
    hub.emit(entityName + ':publish', entity)
  })

  composrEventHub.on(entityName + ':unregistered', 'CorbelComposr', function (entity) {
    hub.emit(entityName + ':unpublish', entity)
  })
}
