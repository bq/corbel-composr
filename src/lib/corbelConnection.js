'use strict';

var corbel = require('corbel-js'),
    config = require('./config'),
    _ = require('lodash'),
    pmx = require('pmx'),
    ComposrError = require('./ComposrError'),
    logger = require('../utils/logger');

var PHRASES_COLLECTION = 'composr:Phrase';

var corbelConfig = config('corbel.driver.options');
corbelConfig = _.extend(corbelConfig, config('corbel.composer.credentials'));

var corbelDriver = corbel.getDriver(corbelConfig);

function regenerateDriver(){
    return corbelDriver.iam.token().create().then(function() {
        logger.debug('corbel:connection:success');
        return corbelDriver;
    }).catch(function(error) {
        logger.error('error:composer:corbel:token', error.response.body);
        pmx.notify('error:composer:corbel:token',  error.response.body);
        throw new ComposrError('error:composer:corbel:token', '', 401);
    });
}

var onConnectPromise = regenerateDriver();

var extractDomain = function(accessToken) {
  try {
    var decoded = corbel.jwt.decode(accessToken.replace('Bearer ', ''));
    return decoded.domainId;
  } catch (e) {
    logger.error('error:invalid:token', accessToken);
    return null;
  }
};

var getTokenDriver = function(accessToken) {

    if (!accessToken) {
        throw new ComposrError('error:connection:undefiend:accessToken');
    }

    var iamToken = {
        'accessToken': accessToken.replace('Bearer ', '')
    };

    var corbelConfig = config('corbel.driver.options');
    corbelConfig.iamToken = iamToken;
    corbelConfig.domain = extractDomain(accessToken);

    return corbel.getDriver(corbelConfig);
};

module.exports.driver = onConnectPromise;
module.exports.PHRASES_COLLECTION = PHRASES_COLLECTION;
module.exports.extractDomain = extractDomain;
module.exports.getTokenDriver = getTokenDriver;
module.exports.regenerateDriver = regenerateDriver;
