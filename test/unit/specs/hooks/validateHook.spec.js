'use strict'
/* globals describe it */

var chai = require('chai')
var sinon = require('sinon')
var expect = chai.expect
var validateHook = require('../../../../src/lib/phraseHooks/validateHook')

describe('Validate hook', function () {
  var getMethodDoc = {
    'queryParameters': {
      'sort': {
        'description': 'sort',
        'enum': [
          'asc',
          'desc'
        ],
        'default': 'asc',
        'required': false,
        'displayName': 'sort',
        'type': 'string'
      },
      'page': {
        'description': 'page',
        'required': true,
        'type': 'number',
        'example': 3,
        'displayName': 'page'
      }
    },
    'protocols': [
      'HTTP'
    ],
    'method': 'get'
  }

  var postMethodDoc = {
    'body': {
      'application/json': {
        'schema': JSON.stringify({
          'type': 'object',
          '$schema': 'http://json-schema.org/draft-03/schema',
          'id': 'http://jsonschema.net',
          'required': true,
          'properties': {
            'songTitle': {
              'type': 'string',
              'required': true
            },
            'albumId': {
              'type': 'string',
              'required': false,
              'minLength': 5,
              'maxLength': 10
            }
          }
        })
      }
    },
    'method': 'post'
  }

  // TODO: We don't support this yet
  // var resourceDoc = {
  //  'uriParameters': {
  //    'id': {
  //      'description': 'type',
  //      'required': false,
  //      'minLength': 1,
  //      'maxLength': 5,
  //      'type': 'string',
  //      'example': 'aaa',
  //      'displayName': 'id'
  //    }
  //  }
  // }

  var emptyDocs = [{},
    {queryParameters: {}},
    {body: {}},
    {body: {'application/json': {}}},
    {body: {'application/json': {schema: ''}}},
    {body: {'application/json': {schema: JSON.stringify({})}}},
    {body: {'application/json': {schema: JSON.stringify({properties: {}})}}}]

  var wrongDocs = [
    {body: {'application/json': {schema: {}}}},
    {body: {'application/json': {schema: {properties: {}}}}}]

  emptyDocs.forEach(function (doc) {
    it('Skips the hook if no schema is provided', function () {
      var req = {
        query: {
          sort: 'asc',
          page: 2
        },
        body: {
          songTitle: 'valid',
          albumId: 'valid'
        }
      }
      var res = {}
      var next = sinon.spy()

      return validateHook(doc)(req, res, next)
        .then(function () {
          expect(next.calledOnce).to.be.true
          var error = next.args[0][0]
          expect(error).to.not.exist
        })
    })
  })

  wrongDocs.forEach(function (doc) {
    it('Rejects for a wrong documentation', function () {
      var req = {
        query: {
          sort: 'asc',
          page: 2
        },
        body: {
          songTitle: 'valid',
          albumId: 'valid'
        }
      }
      var res = {}
      var next = sinon.spy()

      return validateHook(doc)(req, res, next)
        .then(function () {
          expect(next.calledOnce).to.be.true
          var error = next.args[0][0]
          // console.log('DEBUG', error)
          expect(error).to.exist
          expect(error.error).to.equal('error:schema:validation')
          expect(error.status).to.equals(500)
        })
    })
  })

  it('Validates queryParameters against schema', function () {
    var req = {
      query: {
        sort: 'asc',
        // Query parameters are always strings so we need to validate this
        page: '2'
      }
    }
    var res = {}
    var next = sinon.spy()

    return validateHook(getMethodDoc)(req, res, next)
      .then(function () {
        expect(next.calledOnce).to.be.true
        var error = next.args[0][0]
        expect(error).to.not.exist
      })
  })

  it('Rejects queryParameters against schema', function () {
    var req = {
      query: {
        sort: 'invalid',
        page: 'invalid'
      }
    }
    var res = {}
    var next = sinon.spy()

    return validateHook(getMethodDoc)(req, res, next)
      .then(function () {
        expect(next.calledOnce).to.be.true
        var error = next.args[0][0]
        expect(error).to.exist
        expect(error.error).to.equal('error:phrase:validation')
        expect(error.body.errorDescription.length).to.equals(2)
      })
  })

  it('Validates body against schema', function () {
    var req = {
      body: {
        songTitle: 'valid',
        albumId: 'valid'
      }
    }
    var res = {}
    var next = sinon.spy()

    return validateHook(postMethodDoc)(req, res, next)
      .then(function () {
        expect(next.calledOnce).to.be.true
        var error = next.args[0][0]
        expect(error).to.not.exist
      })
  })

  it('Rejects body against schema', function () {
    var req = {
      body: {
        albumId: 'invalidAlbumId'
      }
    }
    var res = {}
    var next = sinon.spy()

    return validateHook(postMethodDoc)(req, res, next)
      .then(function () {
        expect(next.calledOnce).to.be.true
        var error = next.args[0][0]
        expect(error).to.exist
        expect(error.error).to.equal('error:phrase:validation')
        expect(error.body.errorDescription.length).to.equals(2)
      })
  })
})
