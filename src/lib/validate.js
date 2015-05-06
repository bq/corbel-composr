'use strict';

var ComposerError = require('../lib/composerError');
/**
 * Checks if some value is not undefined
 * @param  {Mixed}  value
 * @param  {String}  [message]
 * @throws {Error} If return value is false and message are defined
 * @return {Boolean}
 */
var isDefined = function(value, message) {
    var isUndefined = value === undefined;

    if (isUndefined && message) {
        throw new ComposerError('error:validation', message, 422);
    }
    return !isUndefined;
};

/**
 * Checks if some value is defined and throw error
 * @param  {Mixed}  value
 * @param  {String}  [message]
 * @throws {Error} If return value is false and message are defined
 * @return {Boolean}
 */
var failIfIsDefined = function(value, message) {
    var isDefined = value !== undefined;

    if (isDefined && message) {
        throw new ComposerError('error:validation', message, 422);
    }
    return !isDefined;
};

/**
 * Checks whenever value are null or not
 * @param  {Mixed}  value
 * @param  {String}  [message]
 * @throws {Error} If return value is false and message are defined
 * @return {Boolean}
 */
var isNotNull = function(value, message) {
    var isNull = value === null;

    if (isNull && message) {
        throw new ComposerError('error:validation', message, 422);
    }
    return !isNull;
};

/**
 * Checks whenever a value is not null and not undefined
 * @param  {Mixed}  value
 * @param  {String}  [message]
 * @throws {Error} If return value is false and message are defined
 * @return {Boolean}
 */
var isValue = function(value, message) {
    return this.isDefined(value, message) && this.isNotNull(value, message);
};

/**
 * Checks whenever a value is greater than other
 * @param  {Mixed}  value
 * @param  {Mixed}  greaterThan
 * @param  {String}  [message]
 * @throws {Error} If return value is false and message are defined
 * @return {Boolean}
 */
var isGreaterThan = function(value, greaterThan, message) {
    var gt = this.isValue(value) && value > greaterThan;

    if (!gt && message) {
        throw new ComposerError('error:validation', message, 422);
    }
    return gt;
};

/**
 * Checks whenever a value is greater or equal than other
 * @param  {Mixed}  value
 * @param  {Mixed} isGreaterThanOrEqual
 * @param  {String}  [message]
 * @throws {Error} If return value is false and message are defined
 * @return {Boolean}
 */
var isGreaterThanOrEqual = function(value, isGreaterThanOrEqual, message) {
    var gte = this.isValue(value) && value >= isGreaterThanOrEqual;

    if (!gte && message) {
        throw new ComposerError('error:validation', message, 422);
    }
    return gte;
};

module.exports.isDefined = isDefined;
module.exports.failIfIsDefined = failIfIsDefined;
module.exports.isNotNull = isNotNull;
module.exports.isValue = isValue;
module.exports.isGreaterThan = isGreaterThan;
module.exports.isGreaterThanOrEqual = isGreaterThanOrEqual;