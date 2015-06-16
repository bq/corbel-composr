'use strict';

var validate = require('./validate'),
  corbel = require('corbel-js'),
  config = require('./config'),
  phrases = require('./phrasesData'),
  regexpGenerator = require('./regexpGenerator'),
  ComposerError = require('./composerError'),
  compoSRBuilder = require('./compoSRBuilder'),
  tripwire = require('tripwire'),
  logger = require('../utils/logger'),
  _ = require('lodash'),
  q = require('q');


var PhraseManager = function(){};

PhraseManager.prototype.executePhrase = function executePhrase(context, compoSR, phraseBody) {

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
PhraseManager.prototype.getPhraseIndexById = function getPhraseIndexById(domain, phraseId) {
  validate.isValue(domain, 'undefined:domain');
  validate.isValue(phraseId, 'undefined:phraseId');
  
  return _.findIndex(this.getPhrases(domain), function(item) {
    return item.id === phraseId;
  });
};

/**
 * Returns a phrase in a specific domain that matches path, null if not found
 * @example
 * phrase.url = 'your/phrase/name/:param1?';
 * path = 'your/phrase/name'
 * @param  {String} domain
 * @param  {String} path
 * @return {Object}
 */
PhraseManager.prototype.getPhraseByMatchingPath = function(domain, path){
  validate.isValue(domain, 'undefined:domain');
  validate.isValue(path, 'undefined:path');

  var queryParamsString = path.indexOf('?') !== -1 ? path.substring(path.indexOf('?'), path.length - 1) : '';

  path = path.replace(queryParamsString, '');

  logger.debug('phrase_manager:get_phrase:', path);

  var domainPhrases = this.getPhrases(domain);

  if(!domainPhrases || domainPhrases.length === 0){
    logger.debug('phrase_manager:get_phrase:no_phrases');
    return null;
  }

  var candidates = _.filter(domainPhrases, function(phrase){
    var regexp = new RegExp(phrase.regexp);
    return regexp.test(path);
  });

  logger.debug('phrase_manager:get_phrase_by_name:candidates', candidates.length);
 
  return candidates.length > 0 ? candidates[0] : null;
};

PhraseManager.prototype.registerPhrase = function registerPhrase(phrase) {

  validate.isValue(phrase, 'undefined:phrase');

  var domain = phrase.id.split('!')[0];
  phrases.list[domain] = phrases.list[domain] || [];

  var exists = this.getPhraseIndexById(domain, phrase.id);
  
  phrase.regexp = regexpGenerator.regexpUrl(phrase.url);

  if (exists !== -1) {
    logger.debug('phrase_manager:register_phrase:update', domain);
    phrases.list[domain][exists] = phrase;
  } else {
    logger.debug('phrase_manager:register_phrase:add', domain);
    phrases.list[domain].push(phrase);
  }

};

PhraseManager.prototype.unregisterPhrase = function unregisterPhrase(phrase) {

  validate.isValue(phrase, 'undefined:phrase');
  validate.isValue(phrase.id, 'undefined:phrase:id');

  var domain = phrase.id.split('!')[0];
  var url = '/' + phrase.id.replace(/!/g, '/');

  logger.debug('phrase_manager:unregister_phrase', domain, url);

  // remove from internal data
  var exists = this.getPhraseIndexById(domain, phrase.id);

  if (exists !== -1) {
    phrases.list[domain].splice(exists, 1);
  }
};

PhraseManager.prototype.getPhrases = function getPhrases(domain) {
  return phrases.list[domain];
};

PhraseManager.prototype.run = function run(domain, phrasePath, req, res, next) {

  logger.debug('phrase_manager:run', domain, phrasePath, req.params);

  validate.isValue(domain, 'undefined:domain');
  validate.isValue(phrasePath, 'undefined:phrasePath');

  phrases.list[domain] = phrases.list[domain] || [];

  var phrase = this.getPhraseByMatchingPath(domain, phrasePath);

  logger.debug('phrase_manager:phrases:length', phrases.list[domain].length);
  logger.debug('phrase_manager:exists', (phrase ? phrase.url : null));
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

  this.executePhrase(context, compoSR, phrase[method].code);

};

module.exports = new PhraseManager();
