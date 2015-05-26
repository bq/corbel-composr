var _ = require('lodash'),
    fs = require('fs');

var env = process.env.NODE_ENV || 'development';
var config = require('./config.json');


//Check if environment config file exists and overwrite the defaults
var environmentFileConfig = env + '.json';

try  {
	var fstat = fs.statSync(__dirname + '/' + environmentFileConfig);
	if (fstat.isFile()) {
	    var envConfigFile = require('./' + environmentFileConfig);
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

module.exports = config;
