'use strict';

var config = require('../config/config.json');

var commonCode = function() {
/* jshint ignore:start */
    var corbel = req.app.get('corbel');
    var accessToken = req.get('Authorization') || undefined;
    if (accessToken) {
        accessToken = {'accessToken': accessToken.replace('Bearer ', '')};
    }
    var corbelDriver = corbel.getDriver({resourcesEndpoint:'{resourcesEndpoint}', iamEndpoint:'{iamEndpoint}', IamToken: accessToken});
/* jshint ignore:end */
};

var getCommonCode = function() {
	var corbelConfig = config['composr.corbel.options'];
    var patternCommonCode = /function \(\) {(.*)}/m;
    var commonCodeString = patternCommonCode.exec(commonCode.toString().replace(/(\r\n|\n|\r)/gm, ' '))[1];
    commonCodeString = commonCodeString.replace('{resourcesEndpoint}', corbelConfig.resourcesEndpoint);
    commonCodeString = commonCodeString.replace('{iamEndpoint}', corbelConfig.iamEndpoint);
    return commonCodeString;
};

module.exports.get = getCommonCode;