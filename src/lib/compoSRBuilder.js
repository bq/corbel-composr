'use strict';

var snippetsBundler = require('./snippetsBundler');

/**
 Returns the snippets runner for being embebed into the phrases executions
**/
function getCompoSR(domain){
  var snippets = {
    'apps-sandbox' : [
      {
        name : 'global:parseError',
        code : 'var errorCode=params.err.status?params.err.status:500,errorBody=params.err.data.body&&"string"==typeof params.err.data.body&&-1!==params.err.data.body.indexOf("{")?JSON.parse(params.err.data.body):params.err;params.res.status(errorCode).send(errorBody);'
      }
    ],
    'booqs:demo' : [
      {
        name : 'global:parseError',
        code : 'var errorCode=params.err.status?params.err.status:500,errorBody=params.err.data.body&&"string"==typeof params.err.data.body&&-1!==params.err.data.body.indexOf("{")?JSON.parse(params.err.data.body):params.err;params.res.status(errorCode).send(errorBody);'
      }
    ],
    'silkroad-qa' : [
      {
        name : 'sendJson',
        code : 'compoSR.run("json", params)'
      },
      {
        name : 'json',
        code: 'params.res.send({ hello2 : params.message})'
      }
    ]
  };

  return snippetsBundler.getRunner(domain, snippets);
}

module.exports = {
  getCompoSR : getCompoSR
};
