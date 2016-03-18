'use strict'
var engine = require('../engine')
var logger = require('../../utils/composrLogger')
var _ = require('lodash')

// Implement and include your new hook here to make it available
var hooks = {
  'validate': {
    description: 'Validation hook',
    hookFunction: require('./validateHook')
  },
  'mock': {
    description: 'Mock hook',
    hookFunction: require('./mockHook')
  },
  'corbel-auth-user': {
    description: 'Corbel Auth user hook',
    hookFunction: require('./corbelAuthHook').authUser
  },
  'corbel-auth-client': {
    description: 'Corbel Auth Client hook',
    hookFunction: require('./corbelAuthHook').authClient
  },
  'corbel-driver-setup': {
    description: 'Corbel Driver Setup hook',
    hookFunction: require('./corbelAuthHook').corbelDriverSetup
  },
  'metrics': {
    description: 'Metrics hook',
    hookFunction: require('./metricsHook')
  }
}

module.exports.getHooks = function (phraseItem) {
  var phrase = _.find(engine.composr.data.phrases, ['id', phraseItem.id])

  if (phrase && phrase[phraseItem.verb] && phrase[phraseItem.verb].middlewares) {
    var functions = _.map(phrase[phraseItem.verb].middlewares, function (hookId) {
      if (hooks[hookId]) {
        logger.info('Setting ' + hooks[hookId].description + ' for phrase:', phraseItem.id)
        return hooks[hookId].hookFunction(phrase[phraseItem.verb].doc)
      } else {
        logger.warn('Hook ' + hookId + ' not found for phrase:', phraseItem.id)
        return null
      }
    })
    return _.without(functions, null)
  }
}

module.exports.get = function (hookId) {
  if (hooks[hookId]) {
    return hooks[hookId].hookFunction()
  } else {
    logger.warn('Hook ' + hookId + ' not found')
    return function (req, res, next) {
      next()
    }
  }
}
