'use strict';

var config = require('./config'),
    raml = require('raml-parser'),
    YAML = require('yamljs'),
    validate = require('./validate'),
    _ = require('lodash');

var buildPhraseDefinition = function(phrase) {
    var doc = {};

    var url = '/' + phrase.url;
    doc[url] = {};

    ['get', 'post', 'put', 'delete', 'options'].forEach(function(method) {
        if (phrase[method]) {
            validate.isValue(phrase[method].doc, 'undefined:phrase:' + method + ':doc');
            doc[url][method] = phrase[method].doc;

            // oauth_2_0 has specific type for common header documentation
            if (phrase[method].doc && phrase[method].doc.securedBy && phrase[method].doc.securedBy.indexOf('oauth_2_0') !== -1) {
                doc[url].type = 'secured';
            }
        }
    });

    return doc;
};

/**
 * Builds a raml definition from the doc contained into a phrase
 * @param  {String} domain
 * @param  {Object} phrase
 * @return {String}
 */
var buildDefinition = function(domain, phrases) {
    phrases = phrases || [];
    var urlBase = config['corbel.driver.options'].urlBase.replace('{{module}}', 'composr');

    var doc = {};
    phrases.forEach(function(phrase) {
        _.extend(doc, buildPhraseDefinition(phrase));
    });

    var definition = [
        '#%RAML 0.8',
        '---',
        'title: ' + domain,
        'baseUri: ' + urlBase + domain,
        'securitySchemes:',
        '    - oauth_2_0:',
        '        description: Corbel supports OAuth 2.0 for authenticating all API requests.',
        '        type: OAuth 2.0',
        '        describedBy:',
        '            headers:',
        '                Authorization:',
        '                    description: Used to send a valid OAuth 2 access token.',
        '                    type: string',
        '            responses:',
        '                401:',
        '                    description: Bad or expired token. To fix, you should re-authenticate the user.',
        '        settings:',
        '            authorizationUri: https://oauth.corbel.io/v1.0/oauth/authorize',
        '            accessTokenUri: https://iam.corbel.io/v1.0/oauth/token',
        '            authorizationGrants: [ code, token ]',
        // workaround to show authorization headers in html doc
        'resourceTypes:',
        '    - secured:',
        '        get?: &common',
        '            headers:',
        '                Authorization:',
        '                    description: Token to access secured resources',
        '                    type: string',
        '                    required: true',
        '        post?: *common',
        '        patch?: *common',
        '        put?: *common',
        '        delete?: *common',
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
