'use strict';

var XRegExp = require('xregexp').XRegExp;


function extractParams(path, phraseRegexpReference) {
  var params = {};

  //Store all the names as null values
  phraseRegexpReference.params.forEach(function(param) {
    param = param.replace('?', '');
    params[param] = null;
  });


  var regexp = XRegExp(phraseRegexpReference.regexp); //jshint ignore:line
  var result = XRegExp.exec(path, regexp);

  Object.keys(params).forEach(function(param) {

    if (result && result.hasOwnProperty(param) && typeof(result[param]) !== 'undefined') {
      params[param] = result[param];
    }
  });

  return params;
}

module.exports = {
  extract: extractParams
};