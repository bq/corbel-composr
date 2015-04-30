'use strict';

var config = require('../config/config.json'),
    raml = require('raml-parser'),
    YAML = require('yamljs'),
    validate = require('./validate');

/**
 * Builds a raml definition from the doc contained into a phrase
 * @param  {String} domain
 * @param  {Object} phrase
 * @return {String}
 */
var buildDefinition = function(domain, phrase) {

    var doc = {};

    var url = '/' + phrase.url + ':';
    doc[url] = {};

    ['get', 'post', 'put', 'delete', 'options'].forEach(function(method) {
        if (phrase[method]) {
            validate.isValue(phrase[method].doc, 'undefined:phrase:' + method + ':doc');
            doc[url][method] = phrase[method].doc;
        }
    });

    var urlBase = config['corbel.driver.options'].urlBase.replace('{{module}}', '');

    var definition = [
        '#%RAML 0.8',
        '---',
        'title: ' + phrase.url,
        'baseUri: ' + urlBase + domain,
        YAML.stringify(doc, 4)
    ].join('\n');

    return definition;
};


/**
 * Loads a raml definition from the doc contained into a phrase
 * @param  {String} domain
 * @param  {Object} phrase
 * @return {String}
 */
var load = function(domain, phrase) {
    validate.isValue(domain, 'undefined:domain');
    validate.isValue(phrase, 'undefined:phrase');

    return raml.load(buildDefinition(domain, phrase));
};


module.exports.buildDefinition = buildDefinition;
module.exports.load = load;
