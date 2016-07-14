'use strict'

var cacheModule = require('../modules/cache')

module.exports = function (phraseModel, verb) {
  return function (req, res, next) {
    var authHeader = req.header('Authorization')

    console.log(authHeader)

    var path = req.getHref()

    if (!req.header('Ignore-Cache') && phraseModel.json.cache && phraseModel.json.cache[verb]) {
      console.log('GOING THROUG CACHE STUFF')
      cacheModule.get(path)
        .then(function (response) {
          if (response) {
            console.log('FOUND RESPONSE,', response)
            res.send(parseInt(response.status, 10), JSON.parse(response.body))
          }
          return next()
        })
    } else {
      return next()
    }
  }
}
/*
- Cache set
- Cache get
- PhraseModel.get('cache')
- PhraseExecution 'on After', set cache*/
