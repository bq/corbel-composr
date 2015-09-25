'use strict';

var logger = require('../utils/logger'),
  composr = require('composr-core'),
  config = require('./config');

var phrasesCollection = 'composr:Phrase';
var snippetsCollection = 'composr:Snippet';

function suscribeLogger() {
  composr.events.on('debug', 'CorbelComposr', function() {
    //TODO change to log all, but change core to send less info
    logger.debug(Array.prototype.slice.call(arguments)[0]);
  });

  composr.events.on('error', 'CorbelComposr', function() {
    logger.error.apply(logger, arguments);
  });

  composr.events.on('warn', 'CorbelComposr', function() {
    logger.warn.apply(logger, arguments);
  });

  composr.events.on('info', 'CorbelComposr', function() {
    logger.info.apply(logger, arguments);
  });
}

/**
 * Launches the bootstrap of data, worker and logger
 * @param  {[type]} app [description]
 * @return promise
 */
function init(app) {

  suscribeLogger();

  var coreOptions = {
    credentials: {
      clientId: config('corbel.composer.credentials').clientId,
      clientSecret: config('corbel.composer.credentials').clientSecret,
      scopes: config('corbel.composer.credentials').scopes,
    },
    urlBase: config('corbel.driver.options').urlBase
  };

  return composr.init(coreOptions)
    .then(function() {
      logger.info('Engine initialized, all data is loaded :)');
      return {
        app: app,
        composr : composr
      };
    });

}

module.exports = {
  init: init,
  composr : composr,
  phrasesCollection : phrasesCollection,
  snippetsCollection : snippetsCollection
};