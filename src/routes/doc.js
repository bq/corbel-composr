'use strict';

var engine = require('../lib/engine'),
    ComposrError = require('../lib/ComposrError');


module.exports = function(server) {
  server.get('/doc/:domain', function(req, res, next) {

    var domain = req.params.domain || '';
    //TODO move to core
    var rawPhrases = engine.composr.data.phrases;
    var domainPhrases = rawPhrases.filter(function(item) {
      return item.id.split('!')[0] === domain;
    });

    engine.composr.documentation(domainPhrases, domain)
      .then(function(result) {
        res.send(result);
      }).catch(function(err) {
        next(new ComposrError('error:phrase:doc', 'Error generating doc: ' + err, 422));
      });
  });

}
