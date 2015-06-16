'use strict';

var validate = require('./validate'),
  corbel = require('corbel-js'),
  config = require('./config'),
  phrases = require('./phrasesData'),
  ComposerError = require('./composerError'),
  compoSRBuilder = require('./compoSRBuilder'),
  tripwire = require('tripwire'),
  logger = require('../utils/logger'),
  _ = require('lodash'),
  q = require('q');

var exports = {};

exports.executePhrase = function executePhrase(context, compoSR, phraseBody) {

  // set the limit of execution time to 10000 milliseconds
  tripwire.resetTripwire(config('timeout') || 10000);

  /* jshint evil:true */
  var funct = Function.apply(null, _.keys(context).concat('compoSR', phraseBody));
  funct.apply(null, _.values(context).concat(compoSR));

  // clear the tripwire (in this case this code is never reached)
  var ctx = {
    timedout: true
  };
  tripwire.clearTripwire(ctx);
};

/**
 * Returns index of phrase in a specific domain that matches phraseId, -1 if not found
 * @param  {String} domain
 * @param  {String} phraseId
 * @return {Number}
 */
exports.getPhraseIndexById = function getPhraseIndexById(domain, phraseId) {
  validate.isValue(domain, 'undefined:domain');
  validate.isValue(phraseId, 'undefined:phraseId');
  
  return _.findIndex(exports.getPhrases(domain), function(item) {
    return item.id === phraseId;
  });
};

/**
 * Returns filtered list of possible phrases that would match the length of the uri
 * @param  {Array} phrases
 * @param  {Array} pathparams
 * @return {Array}
 */
exports.getPhrasesWithAllowedNumberOfArguments = function(phrases, params){
  var argumentsSize = params.length;
  
  var phrasesWithSameNumberOfArguments = _.filter(phrases, function(phrase){
    var phraseArguments = _.filter(phrase.url.split('/'), function(item){
      if(item.length !== 0){
        return item;
      }
    });

    var phraseArgumentsSizeMax = phraseArguments.length;
    var phraseArgumentsSizeMin = phraseArgumentsSizeMax;
    
    //The minimum number of arguments decreases if there are optional arguments `:arg?`
    for(var i = 0; i < phraseArguments.length; i++){
      if(phraseArguments[i].indexOf('?') !== -1){
        phraseArgumentsSizeMin--;
      }
    }

    if(phraseArgumentsSizeMax === phraseArgumentsSizeMin && phraseArgumentsSizeMax === argumentsSize){
      return phrase;
    }else if(argumentsSize <= phraseArgumentsSizeMax && argumentsSize >= phraseArgumentsSizeMin){
      return phrase;
    }

  });

  return phrasesWithSameNumberOfArguments;
};

/**
 * Returns index of phrase in a specific domain that matches phraseName, -1 if not found
 * @example
 * phrase.url = 'domain/your/phrase/name/:param1?';
 * phraseName = 'your/phrase/name'
 * @param  {String} domain
 * @param  {String} phraseName
 * @return {Number}
 */
exports.getPhraseByName = function getPhraseByName(domain, phraseName) {
  validate.isValue(domain, 'undefined:domain');
  validate.isValue(phraseName, 'undefined:phraseName');

  logger.debug('phrase_manager:get_phrase:', phraseName);

  var domainPhrases = exports.getPhrases(domain);

  if(!domainPhrases || domainPhrases.length === 0){
    logger.debug('phrase_manager:get_phrase:no_phrases');
    return null;
  }

  //Extract query params in order to search the matching phrase better
  var queryParamsString = phraseName.indexOf('?') !== -1 ? phraseName.substring(phraseName.indexOf('?'), phraseName.length - 1) : '';
  phraseName = phraseName.replace(queryParamsString, '');

  var pathParams = _.filter(phraseName.split('/'), function(item){
    if(item !== ''){
      return item;
    }
  });

  var phrasesWithAllowedNumberOfArguments = exports.getPhrasesWithAllowedNumberOfArguments(domainPhrases, pathParams);

  var possiblePhrases = _.compact(phrasesWithAllowedNumberOfArguments.map(function(phrase) {
    var options = {
      phrase : phrase,
      weight : 0
    };

    //Remove empty arguments
    var phraseArguments = _.filter(phrase.url.split('/'), function(item){
      if(item.length !== 0){
        return item;
      }
    });

    //Empty url phrase `/` with no arguments
    if(phraseArguments.length === 0 && pathParams.length === 0){
      return options;
    }

    var matches = true;

    phraseArguments.forEach(function(item, index){
      if(item === pathParams[index] || item.indexOf(':') === 0){
        options.weight++;
      }else{
        matches = false;
      }
    });

    if(matches){
      return options;
    }

  }));

  logger.debug('phrase_manager:get_phrase_by_name:candidates', possiblePhrases.length);

  possiblePhrases = _.sortBy(possiblePhrases, function(n){
    return -n.weight;
  });

  return possiblePhrases.length > 0 ? possiblePhrases[0].phrase : null;
};

exports.registerPhrase = function registerPhrase(phrase) {

  validate.isValue(phrase, 'undefined:phrase');

  var domain = phrase.id.split('!')[0];
  phrases.list[domain] = phrases.list[domain] || [];

  var exists = exports.getPhraseIndexById(domain, phrase.id);

  if (exists !== -1) {
    logger.debug('phrase_manager:register_phrase:update', domain);
    phrases.list[domain][exists] = phrase;
  } else {
    logger.debug('phrase_manager:register_phrase:add', domain);
    phrases.list[domain].push(phrase);
  }

};

exports.unregisterPhrase = function unregisterPhrase(phrase) {

  validate.isValue(phrase, 'undefined:phrase');
  validate.isValue(phrase.id, 'undefined:phrase:id');

  var domain = phrase.id.split('!')[0];
  var url = '/' + phrase.id.replace(/!/g, '/');

  logger.debug('phrase_manager:unregister_phrase', domain, url);

  // remove from internal data
  var exists = exports.getPhraseIndexById(domain, phrase.id);

  if (exists !== -1) {
    phrases.list[domain].splice(exists, 1);
  }
};

exports.getPhrases = function getPhrases(domain) {
  return phrases.list[domain];
};

exports.run = function run(domain, phraseName, req, res, next) {

  logger.debug('phrase_manager:run', domain, phraseName, req.params);

  validate.isValue(domain, 'undefined:domain');
  validate.isValue(phraseName, 'undefined:phraseName');

  phrases.list[domain] = phrases.list[domain] || [];

  var phrase = exports.getPhraseByName(domain, phraseName);

  logger.debug('phrase_manager:phrases:length', phrases.list[domain].length);
  logger.debug('phrase_manager:exists', phrase.url);
  if (!phrases.list[domain] || !phrase) {
    logger.debug('phrase_manager:not_found');
    return next();
  }

  var method = req.method.toLowerCase();

  logger.debug('phrase_manager:method', method);
  logger.debug('phrase_manager:phrase.method:exist', !!phrase[method]);
  if (!phrase[method]) {
    logger.debug('phrase_manager:not_found');
    return next();
  }

  logger.debug('phrase_manager:phrase.code:exist', phrase[method].code && phrase[method].code.length > 0);
  if (!phrase[method].code || phrase[method].code.length === 0) {
    logger.debug('phrase_manager:code:not_found');
    return next();
  }

  var driverObtainFunction = function(defaults) {
    return function(options) {
      logger.debug(defaults, '-----', options);
      var generatedOptions = _.defaults(_.cloneDeep(options), defaults);
      logger.debug('phrase_manager:corbel.generateDriver', generatedOptions);
      return corbel.getDriver(generatedOptions);
    };
  };

  corbel.generateDriver = driverObtainFunction(config('corbel.driver.options'));

  var corbelDriver = null;
  //If token is present, pregenerate a corbelDriver, otherwise let them manage the corbelDriver instantiation
  if (req.get('Authorization')) {
    logger.debug('phrase_manager:corbel_driver:iam_token');
    var iamToken = {
      'accessToken': req.get('Authorization').replace('Bearer ', '')
    };
    corbelDriver = corbel.generateDriver({
      iamToken: iamToken
    });
  }

  var context = {
    req: req,
    res: res,
    next: next,
    corbelDriver: corbelDriver,
    corbel: corbel,
    ComposerError: ComposerError,
    _: _,
    q: q
  };
  //We have left compoSR alone, without including it in the context because someday we might
  //want to have compoSR use the context for binding req, res... to the snippets
  var compoSR = compoSRBuilder.getCompoSR(domain);

  exports.executePhrase(context, compoSR, phrase[method].code);

};

module.exports = exports;
