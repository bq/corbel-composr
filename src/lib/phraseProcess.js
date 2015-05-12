'use strict';

var corbel = require('corbel-js');
var config = require('../config/config.json');

//Return the necessary corbel driver
function getCorbelDriver(iamToken){
  var corbelConfig = config['corbel.driver.options'];
  corbelConfig.iamToken = iamToken;

  var corbelDriver = corbel.getDriver(corbelConfig);
  return corbelDriver;
}

//Process the phrase on a child process
process.on('message', function(data) {
    //Pass the params to the phrase
    var params = data.params;
    var body = data.body;
    var phrase = data.phrase;
    var corbelDriver = getCorbelDriver(data.iamToken);

    //Construct the mocks for the req and res objects
    var req = {
      body : body,
      params : params
    };

    var res = {};
    ['err', 'send', 'json'].forEach(function(type){
      res[type] = function(){
        console.log('sending response');
        var args =  Array.prototype.slice.call(arguments);
        process.send({trigger: 'res', type : type, args : args});
      };
    });

    //TODO: construct the mock for the next object
    var next = function(err){
      process.send({trigger: 'next', err: err});
    };


    //Create the phrase execution
    /*jslint evil: true */
    var funct = new Function('req', 'res', 'next', 'corbelDriver', phrase);
    var args = [req, res, next, corbelDriver];
    funct.apply(null, args);
});
