'use strict'

var cacheModule = require('../modules/cache')

module.exports.cache = function (phraseModel) {
  return function (req, res, next) {
    var authHeader = req.header('Authorization')

    console.log(authHeader)

    var path = req.getHref()

    if (!req.get('Ignore-Cache') && phraseModel.get('cache')) {
      cacheModule.get(path)
        .then(function (response) {
          if (response) {
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
