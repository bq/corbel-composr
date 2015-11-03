'use strict';
var request = require('supertest'),
chai = require('chai'),
expect = chai.expect,
chaiAsPromised = require('chai-as-promised'),
should = chai.should();

chai.use(chaiAsPromised);

function test(server) {
  describe('Generate documentation', function() {

    var doc = {
      "queryParameters": {},
      "securedBy": [
        "oauth_2_0"
      ],
      "description": "Gets the catalogue, can be requested with a client token or a user token",
      "responses": {
        "200": {
          "description": "Catalogue response wololo1",
          "body": {
            "application/json": {
              "schema": "{\n\t\"$schema\": \"http://json-schema.org/schema\",\n\t\"description\": \"\",\n\t\"type\": \"object\",\n\t\"properties\": {\n\t\t\"page\": {\n\t\t\t\"type\": \"number\"\n\t\t},\n\t\t\"pageSize\": {\n\t\t\t\"type\": \"number\"\n\t\t},\n\t\t\"count\": {\n\t\t\t\"type\": \"number\"\n\t\t},\n\t\t\"catalog\": {\n\t\t\t\"type\": \"array\",\n\t\t\t\"uniqueItems\": true,\n\t\t\t\"minItems\": 1,\n\t\t\t\"items\": {\n\t\t\t\t\"required\": [\n\t\t\t\t\t\"id\",\n\t\t\t\t\t\"coverImageUrl\",\n\t\t\t\t\t\"titleText\",\n\t\t\t\t\t\"owned\"\n\t\t\t\t],\n\t\t\t\t\"properties\": {\n\t\t\t\t\t\"id\": {\n\t\t\t\t\t\t\"type\": \"string\",\n\t\t\t\t\t\t\"minLength\": 1\n\t\t\t\t\t},\n\t\t\t\t\t\"coverImageUrl\": {\n\t\t\t\t\t\t\"type\": \"string\",\n\t\t\t\t\t\t\"minLength\": 1\n\t\t\t\t\t},\n\t\t\t\t\t\"titleText\": {\n\t\t\t\t\t\t\"type\": \"string\",\n\t\t\t\t\t\t\"minLength\": 1\n\t\t\t\t\t},\n\t\t\t\t\t\"authors\": {\n\t\t\t\t\t\t\"type\": \"array\",\n\t\t\t\t\t\t\"items\": {\n\t\t\t\t\t\t\t\"required\": [],\n\t\t\t\t\t\t\t\"properties\": {}\n\t\t\t\t\t\t}\n\t\t\t\t\t},\n\t\t\t\t\t\"owned\": {\n\t\t\t\t\t\t\"type\": \"boolean\"\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t},\n\t\"required\": [\n\t\t\"page\",\n\t\t\"pageSize\",\n\t\t\"count\",\n\t\t\"catalog\"\n\t]\n}",
              "example": "{\n\t\"page\": 0,\n\t\"pageSize\": 4,\n\t\"count\": 20,\n\t\"catalog\": [\n\t\t{\n\t\t\t\"id\": \"18f6e244a22fd84d423204f45034d25d\",\n\t\t\t\"coverImageUrl\": \"https://resources-qa.bqws.io/v1.0/resource/books:Book/18f6e244a22fd84d423204f45034d25d\",\n\t\t\t\"titleText\": \"Praga De cerca 3\",\n\t\t\t\"authors\": [\n\t\t\t\tnull\n\t\t\t],\n\t\t\t\"owned\": false\n\t\t}\n\t]\n}"
            }
          }
        },
        "400": {
          "description": "Bad Request wololo2",
          "body": {
            "application/json": {
              "schema": "{\n\t\"$schema\": \"http://json-schema.org/schema\",\n\t\"description\": \"\",\n\t\"type\": \"object\",\n\t\"properties\": {\n\t\t\"httpStatus\": {\n\t\t\t\"type\": \"number\"\n\t\t},\n\t\t\"error\": {\n\t\t\t\"type\": \"string\",\n\t\t\t\"minLength\": 1\n\t\t},\n\t\t\"errorDescription\": {\n\t\t\t\"type\": \"string\",\n\t\t\t\"minLength\": 1\n\t\t}\n\t},\n\t\"required\": [\n\t\t\"httpStatus\",\n\t\t\"error\",\n\t\t\"errorDescription\"\n\t]\n}",
              "example": "{\n\t\"httpStatus\": 400,\n\t\"error\": \"error:jwt:missing\",\n\t\"errorDescription\": \"Ftsearch missing\"\n}"
            }
          }
        },
        "401": {
          "description": "Not authorized wololo3",
          "body": {
            "application/json": {
              "schema": "{\n\t\"$schema\": \"http://json-schema.org/schema\",\n\t\"description\": \"\",\n\t\"type\": \"object\",\n\t\"properties\": {\n\t\t\"httpStatus\": {\n\t\t\t\"type\": \"number\"\n\t\t},\n\t\t\"error\": {\n\t\t\t\"type\": \"string\",\n\t\t\t\"minLength\": 1\n\t\t},\n\t\t\"errorDescription\": {\n\t\t\t\"type\": \"string\"\n\t\t}\n\t},\n\t\"required\": [\n\t\t\"httpStatus\",\n\t\t\"error\",\n\t\t\"errorDescription\"\n\t]\n}",
              "example": "{\n\t\"httpStatus\": 401,\n\t\"error\": \"unauthorized\",\n\t\"errorDescription\": \"\"\n}"
            }
          }
        }
      }
    };


    var phrase = {
      url: 'docField/:id/:name',
      id : 'testDomainComposr!docField!:id!:name',
      get: {
        code: 'res.status(200).send(req.params);',
        doc: doc
      }
    };

    before(function() {
      server.composr.data.phrases.push(phrase);
    });


    it('executes the phrase correctly', function(done) {
      this.timeout(30000);

      request(server.app)
      .get('/doc/testDomainComposr')
      .expect(200)
      .end(function(err, response) {
        expect(response).to.be.an('object');
        expect(response.text).to.be.a('string');
        expect(response.text.indexOf('docField/{id}/{name}')).to.not.equals(-1);
        done(err);
      });
    });


  });
}

module.exports = test;
