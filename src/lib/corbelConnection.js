'use strict';

var corbel = require('corbel-js'),
    config = require('../config/config.json'),
    _ = require('underscore');

var PHRASES_COLLECTION = 'composr:Phrase';

var corbelConfig = config['corbel.driver.options'];
corbelConfig = _.extend(corbelConfig, config['corbel.composer.credentials']);

var corbelDriver = corbel.getDriver(corbelConfig);

var onConnectPromise = corbelDriver.iam.token().create().then(function(response) {
    console.log('corbel:connection:success', response);
	return corbelDriver;
}).catch(function(error) {
    console.error('error:ccomposer:corbel:token', error);
    throw new Error('error:ccomposer:corbel:token');
});

module.exports.driver = onConnectPromise;
module.exports.PHRASES_COLLECTION = PHRASES_COLLECTION;
