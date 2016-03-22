'use strict'
/* globals before describe it */

var request = require('supertest')
var chai = require('chai')
var expect = chai.expect

function test (server) {
  /*
   Example model response
    {
      "page": 0,
      "pageSize": 4,
      "count": 20,
      "catalog": [{
        "id": "18f6e244a22fd84d423204f45034d25d",
        "coverImageUrl": "hello",
        "titleText": "Praga De cerca 3",
        "authors": [null],
        "owned": false
      }]
    }
   */
  describe('Mock middleware', function () {
    var phraseMock_1 = {
      url: 'mockedphrase',
      version: '1.1.1',
      get: {
        code: 'res.status(200).send("this code wont be executed")',
        middlewares: ['mock'],
        doc: {
          securedBy: [
            'oauth_2_0'
          ],
          description: 'A phrase with a mocked response',
          responses: {
            200: {
              description: 'Catalogue response',
              body: {
                'application/json': {
                  'schema': '{\n\t"$schema": "http://json-schema.org/draft-04/schema#",\n\t"description": "",\n\t"type": "object",\n\t"properties": {\n\t\t"page": {\n\t\t\t"type": "number"\n\t\t},\n\t\t"pageSize": {\n\t\t\t"type": "number"\n\t\t},\n\t\t"count": {\n\t\t\t"type": "number"\n\t\t},\n\t\t"catalog": {\n\t\t\t"type": "array",\n\t\t\t"uniqueItems": true,\n\t\t\t"minItems": 1,\n\t\t\t"items": {\n\t\t\t\t"required": [\n\t\t\t\t\t"id",\n\t\t\t\t\t"coverImageUrl",\n\t\t\t\t\t"titleText",\n\t\t\t\t\t"owned"\n\t\t\t\t],\n\t\t\t\t"properties": {\n\t\t\t\t\t"id": {\n\t\t\t\t\t\t"type": "string",\n\t\t\t\t\t\t"minLength": 1\n\t\t\t\t\t},\n\t\t\t\t\t"coverImageUrl": {\n\t\t\t\t\t\t"type": "string",\n\t\t\t\t\t\t"minLength": 1\n\t\t\t\t\t},\n\t\t\t\t\t"titleText": {\n\t\t\t\t\t\t"type": "string",\n\t\t\t\t\t\t"minLength": 1\n\t\t\t\t\t},\n\t\t\t\t\t"authors": {\n\t\t\t\t\t\t"type": "array",\n\t\t\t\t\t\t"items": {\n\t\t\t\t\t\t\t"required": [],\n\t\t\t\t\t\t\t"properties": {}\n\t\t\t\t\t\t}\n\t\t\t\t\t},\n\t\t\t\t\t"owned": {\n\t\t\t\t\t\t"type": "boolean"\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t},\n\t"required": [\n\t\t"page",\n\t\t"pageSize",\n\t\t"count",\n\t\t"catalog"\n\t]\n}',
                  'example': '{\n\t"page": 0,\n\t"pageSize": 4,\n\t"count": 20,\n\t"catalog": [\n\t\t{\n\t\t\t"id": "18f6e244a22fd84d423204f45034d25d",\n\t\t\t"coverImageUrl": "hello",\n\t\t\t"titleText": "Praga De cerca 3",\n\t\t\t"authors": [\n\t\t\t\tnull\n\t\t\t],\n\t\t\t"owned": false\n\t\t}\n\t]\n}'
                }
              }
            }
          }
        }
      }
    }

    before(function (done) {
      var phrases = [
        phraseMock_1
      ]

      server.composr.Phrase.register('thedomain:mock', phrases)
        .should.be.eventually.fulfilled.and.notify(done)
    })

    it('returns an example response', function (done) {
      request(server.app)
        .get('/thedomain:mock/mockedphrase')
        .expect(200)
        .end(function (err, response) {
          expect(response.body).to.be.a('object')
          expect(response.body).to.include.keys('page', 'pageSize', 'count', 'catalog')
          expect(response.body.catalog).to.be.an('array')
          expect(response.body.catalog[0]).to.include.keys('id', 'coverImageUrl', 'titleText', 'owned')
          done(err)
        })
    })
  })
}

module.exports = test
