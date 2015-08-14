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
        code : 'var errorCode=500,errorBody=params.err;"object"==typeof params.err&&params.err&&(errorCode=params.err.status?params.err.status:errorCode,params.err.data&&params.err.data.status&&(errorCode=params.err.data.status),errorBody=params.err.data?params.err.data:errorBody),params.res.status(errorCode).send(errorBody);'
      }
    ],
    'booqs:demo' : [
      {
        name : 'global:parseError',
        code : 'var errorCode=500,errorBody=params.err;"object"==typeof params.err&&params.err&&(errorCode=params.err.status?params.err.status:errorCode,params.err.data&&params.err.data.status&&(errorCode=params.err.data.status),errorBody=params.err.data?params.err.data:errorBody),params.res.status(errorCode).send(errorBody);'
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
