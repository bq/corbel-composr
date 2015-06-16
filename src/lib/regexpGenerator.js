'use strict';

/**
 * Returns a regexp for a express route
 * @example
 * url = 'domain/your/phrase/:name/:param1?'; => regexp = '/domain/your/phrase/%s[/%s';
 * @param  {String} url
 * @return {String}
 */
function regexpUrl(url){
	var pathParams = url.split('/');

	//Empty args, regex for empty element
	if(pathParams.length === 1 && pathParams[0] === ''){
		return '^$|^/$';
	}

	var regexp = pathParams.reduce(function(prev, next, index){
		var newValue = '';
		
		if(prev.length > 0){
			//Theres a previous value, add a slash
			newValue = '\/';
		}else if(pathParams.length === 1 && next.indexOf(':') !== -1){
			//Single param in the form of ':param'  or ':param?' requires indicator of start of the string
			newValue = '^';
		}

		if(next.indexOf(':') === 0){
			//Param can have any value, evaluate expression
			if(index === pathParams.length -1 && pathParams.length !== 1 && next.indexOf('?') !== -1){
				newValue += '(\\w+\/?)?';
			}else{
				newValue += '\\w+\/?';
			}
			
		}else{
			//Fixed value in the form of 'fixednameparam', replace the ? symbol in case it's an optional param
			newValue += next.replace('?', '');
		}

		if(next.indexOf('?') !== -1){
			//If is an optional param, add ( )
			newValue = '(' + newValue + ')?';
		}

		//Single param in the form of ':param' , 'param' or ':param?' requires indicator of end of the string
		if((pathParams.length === 1 && next.indexOf(':') !== -1) || (next.indexOf(':') !== -1 && index === pathParams.length -1)){
			newValue += '$';
		}

		return prev + newValue;
	}, '');

	return regexp;
}

module.exports = {
	regexpUrl : regexpUrl
};