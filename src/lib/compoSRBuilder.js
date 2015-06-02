'use strict';

var snippetsBundler = require('./snippetsBundler');

/**
 Returns the snippets runner for being embebed into the phrases executions
**/
function getCompoSR(domain){
  var snippets = {
    'silkroad-qa' : [
      {
        name : 'log',
        code : 'console.log("ey");'
      },
      {
        name : 'example',
        code : 'this.log();'
      },
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