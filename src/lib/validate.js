'use strict';

var ComposerError = require('./composerError'),
  regexpGenerator = require('./regexpGenerator'),
  XRegExp = require('xregexp').XRegExp;
/**
 * Checks if some value is not undefined
 * @param  {Mixed}  value
 * @param  {String}  [errorCode]
 * @throws {Error} If return value is false and errorCode are defined
 * @return {Boolean}
 */
var isDefined = function(value, errorCode) {
  var isUndefined = value === undefined;

  if (isUndefined && errorCode) {
    throw new ComposerError(errorCode, 'isDefined undefined: ' + value, 422);
  }
  return !isUndefined;
};

/**
 * Checks if some value is defined and throw error
 * @param  {Mixed}  value
 * @param  {String}  [errorCode]
 * @throws {Error} If return value is false and errorCode are defined
 * @return {Boolean}
 */
var failIfIsDefined = function(value, errorCode) {
  var isDefined = value !== undefined;

  if (isDefined && errorCode) {
    throw new ComposerError(errorCode, 'failIfIsDefined undefined: ' + value, 422);
  }
  return !isDefined;
};

/**
 * Checks whenever value are null or not
 * @param  {Mixed}  value
 * @param  {String}  [errorCode]
 * @throws {Error} If return value is false and errorCode are defined
 * @return {Boolean}
 */
var isNotNull = function(value, errorCode) {
  var isNull = value === null;

  if (isNull && errorCode) {
    throw new ComposerError(errorCode, 'isNotNull undefined: ' + value, 422);
  }
  return !isNull;
};

/**
 * Checks whenever a value is not null and not undefined
 * @param  {Mixed}  value
 * @param  {String}  [errorCode]
 * @throws {Error} If return value is false and errorCode are defined
 * @return {Boolean}
 */
var isValue = function(value, errorCode) {
  return this.isDefined(value, errorCode) && this.isNotNull(value, errorCode);
};

/**
 * Checks whenever a value is greater than other
 * @param  {Mixed}  value
 * @param  {Mixed}  greaterThan
 * @param  {String}  [errorCode]
 * @throws {Error} If return value is false and errorCode are defined
 * @return {Boolean}
 */
var isGreaterThan = function(value, greaterThan, errorCode) {
  var gt = this.isValue(value) && value > greaterThan;

  if (!gt && errorCode) {
    throw new ComposerError(errorCode, 'isGreaterThan undefined: ' + value, 422);
  }
  return gt;
};

/**
 * Checks whenever a value is greater or equal than other
 * @param  {Mixed}  value
 * @param  {Mixed} isGreaterThanOrEqual
 * @param  {String}  [errorCode]
 * @throws {Error} If return value is false and errorCode are defined
 * @return {Boolean}
 */
var isGreaterThanOrEqual = function(value, isGreaterThanOrEqual, errorCode) {
  var gte = this.isValue(value) && value >= isGreaterThanOrEqual;

  if (!gte && errorCode) {
    throw new ComposerError(errorCode, 'isGreaterThanOrEqual undefined: ' + value, 422);
  }
  return gte;
};

/**
 * Checks whenever a phrase url is well formed
 * @param  {String}  url
 * @param  {String}  [errorCode]
 * @throws {Error} If return value is false and errorCode are defined
 * @return {XRegExp}
 */
var isValidUrl = function(url, errorCode) {
  var regexp;
  try {
    var regexp = XRegExp(regexpGenerator.regexpUrl(url)); //jshint ignore : line
    XRegExp.test('test', regexp);
  } catch (e) {
    if (errorCode) {
      throw new ComposerError(errorCode, 'malformedUrl: ' + url, 422);
    }
  }
  return regexp;
};

/**
 * Checks that is a valid base64
 * @param  {String}  codebase64
 * @param  {String}  errorCode
 * @return {Boolean}
 */
var isValidBase64 = function(codebase64, errorCode) {
  var base64 = /^(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})$/i;
  var isValid = base64.test(codebase64);

  if (!isValid && errorCode) {
    throw new ComposerError(errorCode, 'isValidBase64 undefined: ' + codebase64, 422);
  }
  return isValid;
};

module.exports.isDefined = isDefined;
module.exports.failIfIsDefined = failIfIsDefined;
module.exports.isNotNull = isNotNull;
module.exports.isValue = isValue;
module.exports.isGreaterThan = isGreaterThan;
module.exports.isGreaterThanOrEqual = isGreaterThanOrEqual;
module.exports.isValidUrl = isValidUrl;
module.exports.isValidBase64 = isValidBase64;