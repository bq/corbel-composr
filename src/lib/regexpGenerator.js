'use strict';

/**
 * Returns a regexp for a express route
 * @example
 * url = 'domain/your/phrase/:name/:param1?'; => regexp = '/domain/your/phrase/%s[/%s';
 * @param  {String} url
 * @return {String}
 */
function regexpUrl(url) {
  var pathParams = url.split('/');
  var EMPTY_PARAMS_REGEXP = '^$|^/$';

  var paramsLength = pathParams.length;

  function isEmptyArgument() {
    return paramsLength === 1 && pathParams[0] === '';
  }

  function isOptionalArgument(item) {
    return item.indexOf('?') !== -1;
  }

  function isParamArgument(item) {
    return item.indexOf(':') !== -1;
  }

  //Empty args, regex for empty element
  if (isEmptyArgument()) {
    return EMPTY_PARAMS_REGEXP;
  }

  var regexp = pathParams.reduce(function(prev, item, index) {
    var newValue = '';

    if (index !== 0) {
      //Theres a previous value, add a slash
      newValue = '\/';
    }

    if (isParamArgument(item)) {

      //Param can have any value, evaluate expression
      if (isOptionalArgument(item, index) && index === paramsLength - 1 && paramsLength !== 1) {
        newValue += '((?<'+ item.replace(':', '').replace('?', '') +'>[\\w-._~:?#\\[\\]@!$&()*+,;=!]+)\/?)?';
      } else {
        newValue += '(?<'+ item.replace(':', '').replace('?', '') +'>[\\w-._~:?#\\[\\]@!$&()*+,;=!]+)\/?';
      }

    } else {
      //Fixed value in the form of 'fixednameparam', replace the ? symbol in case it's an optional param
      newValue += item.replace('?', '');
    }


    if (isOptionalArgument(item, index)) {
      //If is an optional param, add ( )
      newValue = '(' + newValue + ')?';
    }


    if ((pathParams.length === 1 && isParamArgument(item)) || index === 0) {
      //Single param in the form of ':param'  or ':param?' requires indicator of start of the string
      newValue = '^\/?' + newValue;
    }


    //Single param in the form of ':param' , 'param' or ':param?' requires indicator of end of the string
    if (index === paramsLength - 1) {
      if (!isParamArgument(item)) {
        newValue += '\/?';
      }
      newValue += '$';
    }

    return prev + newValue;
  }, '');

  return regexp;
}

function regexpReference(url){
  var PARAMS_EXTRACTOR_REGEX = /:(\w+)\?*/g;
  var params = url.match(PARAMS_EXTRACTOR_REGEX) || [];
  var regexp = regexpUrl(url);

  params = params.map(function(param){
    return param.replace(':', '');
  });

  return {
    params : params,
    regexp : regexp
  };

}

module.exports = {
  regexpUrl: regexpUrl,
  regexpReference : regexpReference
};