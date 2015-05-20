'use strict';

var _ = require('lodash');


/**
 Returns the domains some domain can access, this includes himself and his parents
 - For example:
   domain "_silkroad:domain" should be able to access "_silkroad:domain" and "_silkroad"
**/
function getAllowedDomainNames(snippets, domain){
  var domains = domain.split(':');

  var allowedDomainNames = _.filter(_.keys(snippets), function(domainName){
    //Reduce the parts that forms a domain name,
    //if all the parts are present on the domain it should be allowed
    var domainNameParts = domainName.split(':');

    return domainNameParts.reduce(function(previousValue, currentValue, index) {
      return (previousValue && domains[index] === currentValue);
    }, true);
  });

  return allowedDomainNames;
}

/**
 Return all the snippets that are accesible to a single domain name and its parents
**/
function getDomainSnippets(snippets, domain){
  var allowedDomainNames = getAllowedDomainNames(snippets, domain);

  var functions = {};

  allowedDomainNames.forEach(function(domainName){
      snippets[domainName].forEach(function(snippet){
        //Overwrite functions
        functions[snippet.name] = snippet.code;
      });
  });

  return functions;
}

/**
 Constructs the object that will have access to all the snippets of the domain
**/
var Runner = function(domain, snippets){
  this.domain = domain;
  this.snippets = getDomainSnippets(snippets, domain);
};

Runner.prototype.run = function(snippetName, params){
  /* jshint evil:true */
  var funct = new Function('params', 'compoSR', this.snippets[snippetName]);
  funct(params, this);
};

function getRunner(domain, snippets){
  return new Runner(domain, snippets);
}


module.exports = {
  getRunner: getRunner,
  getDomainSnippets : getDomainSnippets
};
