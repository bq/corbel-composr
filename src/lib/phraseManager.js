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

var executePhrase = function(context, compoSR, phraseBody) {

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
var getById = function(domain, phraseId) {
  validate.isValue(domain, 'undefined:domain');
  validate.isValue(phraseId, 'undefined:phraseId');

  return _.findIndex(phrases.list[domain], function(item) {
    return item.id === phraseId;
  });
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
var getByPhraseName = function(domain, phraseName) {
  validate.isValue(domain, 'undefined:domain');
  validate.isValue(phraseName, 'undefined:phraseName');

  return _.findIndex(phrases.list[domain], function(item) {
    var itemPhraseName = item.url.split(':')[0].slice(0, -1);

    return phraseName.indexOf(itemPhraseName) !== -1;
  });
};

var registerPhrase = function(phrase) {

  validate.isValue(phrase, 'undefined:phrase');

  var domain = phrase.id.split('!')[0];
  phrases.list[domain] = phrases.list[domain] || [];

  var exists = getById(domain, phrase.id);

  if (exists !== -1) {
    logger.debug('phrase_manager:register_phrase:update', domain);
    phrases.list[domain][exists] = phrase;
  } else {
    logger.debug('phrase_manager:register_phrase:add', domain);
    phrases.list[domain].push(phrase);
  }

};

var unregisterPhrase = function(phrase) {

  validate.isValue(phrase, 'undefined:phrase');
  validate.isValue(phrase.id, 'undefined:phrase:id');

  var domain = phrase.id.split('!')[0];
  var url = '/' + phrase.id.replace(/!/g, '/');

  logger.debug('phrase_manager:unregister_phrase', domain, url);

  // remove from internal data
  var exists = getById(domain, phrase.id);

  if (exists !== -1) {
    phrases.list[domain].splice(exists, 1);
  }
};

var getPhrases = function(domain) {
  return phrases.list[domain];
};

var run = function(domain, phraseName, req, res, next) {

  logger.debug('phrase_manager:run', domain, phraseName, req.params);

  validate.isValue(domain, 'undefined:domain');
  validate.isValue(phraseName, 'undefined:phraseName');

  phrases.list[domain] = phrases.list[domain] || [];

  var exists = getByPhraseName(domain, phraseName);

  logger.debug('phrase_manager:phrases:length', phrases.list[domain].length);
  logger.debug('phrase_manager:exists', exists);
  if (!phrases.list[domain] || exists === -1) {
    logger.debug('phrase_manager:not_found');
    return next();
  }

  var phrase = phrases.list[domain][exists],
    method = req.method.toLowerCase();

  logger.debug('phrase_manager:method', method);
  logger.debug('phrase_manager:phrase.method:exist', !!phrase[method]);
  if (!phrase[method]) {
    logger.debug('phrase_manager:not_found');
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

  executePhrase(context, compoSR, phrase[method].code);

};

module.exports.registerPhrase = registerPhrase;
module.exports.unregisterPhrase = unregisterPhrase;
module.exports.executePhrase = executePhrase;
module.exports.getPhrases = getPhrases;
module.exports.getById = getById;
module.exports.getByPhraseName = getByPhraseName;
module.exports.run = run;
