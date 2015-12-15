/*************************************
  Diagnose and Performance
**************************************/
'use strict';
module.exports = function(config,logger) {
    /*************************************
      New Relic
    **************************************/
    if (config('newrelic') === true || config('newrelic') === 'true') {
        require('newrelic');
    }

    logger.info(' - Diagnose Middlewares loaded');
};
