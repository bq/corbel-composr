'use strict';
var request = require('supertest'),
chai = require('chai'),
expect = chai.expect,
chaiAsPromised = require('chai-as-promised'),
should = chai.should();
chai.use(chaiAsPromised);

function test(server) {
  describe('Unregister multiple snippets', function() {
    var unregisterSnippet1 = {
      id : 'testDomainComposr!unregisterSnippet1',
      codehash : new Buffer('var thing = function(res){ res.status(201).send("test"); }; exports(thing);').toString('base64')
    };

    var unregisterSnippet2 = {
      id : 'testDomainComposr!unregisterSnippet2',
      codehash : new Buffer('var thing = function(res,param){res.status(200).send(param.toUpperCase()); }; exports(thing);').toString('base64')
    };

    var basicPhrase = {
      url: 'unregister-snippet-test',
      get: {
        code: 'var mything = require("snippet-unregisterSnippet1"); mything(res);',
        doc: {}
      }
    };

    var upperCasePhrase = {
      url: 'unregister-snippet-test/:name',
      get: {
        code: 'var mything = require("snippet-unregisterSnippet2"); mything(res,req.params.name);',
        doc: {}
      }
    };

    before(function(done) {
      this.timeout(30000);
      server.composr.Snippets.register('testDomainComposr',
      [unregisterSnippet1,unregisterSnippet2])
      .should.be.fulfilled
      .then(function() {
        return server.composr.Phrases.register('testDomainComposr',
        [basicPhrase,upperCasePhrase]);
      })
      .should.be.fulfilled.notify(done);
    });

    describe('fails using unregistered snippets', function(){
      this.timeout(30000);
      //Check that both phrases use the snippets
      before(function(done){
        var promise1 = new Promise(function(resolve, reject){
          request(server.app)
          .get('/testDomainComposr/unregister-snippet-test')
          .expect(201)
          .end(function(err, response) {
            expect(response).to.be.an('object');
            expect(response.text).to.equals('"test"');
            if (err){
              reject(err);
            }else{
              resolve();
            }
          });
        });

        var promise2 = new Promise(function(resolve, reject){
          request(server.app)
          .get('/testDomainComposr/unregister-snippet-test/juan')
          .expect(200)
          .end(function(err, response) {
            expect(response).to.be.an('object');
            expect(response.text).to.equals('"JUAN"');
            if (err){
              reject(err);
            }else{
              resolve();
            }
          });
        });

        Promise.all([promise1, promise2])
        .should.be.fulfilled
        .then(function(){
          //All has worked as expected, unregister the snippets
          server.composr.Snippets.unregister('testDomainComposr',
          [unregisterSnippet1.id,unregisterSnippet2.id]);
          done();
        });
      });

      it('should fail when using an unregistered snippet', function(done) {
        request(server.app)
        .get('/testDomainComposr/unregister-snippet-test')
        .expect(500)
        .end(function(err, response) {
          expect(response.body).to.be.an('object');
          expect(response.body.error).to.equals('error:phrase:exception:unregister-snippet-test');
          console.log(response.body);
          done(err);
        });
      });

      it('should fail when using the other unregistered snippet', function(done){
        request(server.app)
        .get('/testDomainComposr/unregister-snippet-test/juan')
        .expect(500)
        .end(function(err, response) {
          expect(response.body).to.be.an('object');
          expect(response.body.error).to.equals('error:phrase:exception:unregister-snippet-test/:name');
          done(err);
        });
      });
    });
  });
}

module.exports = test;
