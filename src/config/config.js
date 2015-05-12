var _ = require('lodash'),
    fs = require('fs');

var env = process.env.NODE_ENV || 'development';
var config = require('./config.json');


//Check if enviroment config file exists and overwrite the defaults
var environmentFileConfig = env + '.json';
var fstat = fs.statSync(__dirname + '/' + environmentFileConfig);
if (fstat.isFile()) {
    var envConfig = require('./' + environmentFileConfig);
    config = _.defaults(envConfig, config);
}

module.exports = config;
