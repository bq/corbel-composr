'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    ComposerError = require('./composerError');

var env = process.env.NODE_ENV || 'development';
var config = require('../config/config.json');


//Check if environment config file exists and overwrite the defaults
var environmentFileConfig = env + '.json';

try  {
	var fstat = fs.statSync(__dirname + '/../config/' + environmentFileConfig);
	if (fstat.isFile()) {
	    var envConfigFile = require('../config/' + environmentFileConfig);
	    config = _.defaults(envConfigFile, config);
	}
} catch (e) {
	console.log('warn:config:' + env + ':undefined');
}

//Finally if it exists on the environment, use this
if(process.env.COMPOSR_CONFIG){
  try{
    var envConfig = typeof(process.env.COMPOSR_CONFIG) === 'object' ? process.env.COMPOSR_CONFIG : JSON.parse(process.env.COMPOSR_CONFIG);
    config = _.defaults(envConfig, config);
  }catch(e){
    console.log(e);
    console.log('warn:config:badformatedConfig' + env + ':undefined');
  }
}

module.exports = function(key, haltOnUndefined){
  if(!key){
    return _.cloneDeep(config);
  }else if(typeof(config[key]) === 'undefined' && haltOnUndefined){
    throw new ComposerError('error:composr:config:undefined', '', 500);
  }else{
    return _.cloneDeep(config[key]);
  }
};
