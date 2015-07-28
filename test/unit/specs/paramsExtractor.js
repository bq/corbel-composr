'use strict';

var regexpGenerator = require('../../../src/lib/regexpGenerator.js'),
  paramsExtractor = require('../../../src/lib/paramsExtractor.js'),
  XRegExp = require('xregexp').XRegExp,
  chai = require('chai'),
  expect = chai.expect;

describe('in paramsExtractor module', function() {

  describe('Get the correct params for each url', function() {
    var urls = [{
      url: '',
      callee: '',
      test: {}
    }, {
      url: ':param',
      callee: 'hola',
      test: {
        param: 'hola'
      }
    }, {
      url: ':param?',
      callee: '',
      test: {
        param: null
      }
    }, {
      url: ':param?',
      callee: 'asd',
      test: {
        param: 'asd'
      }
    }, {
      url: 'logoutuser/:type?',
      callee: 'logoutuser/',
      test: {
        type: null
      }
    }, {
      url: 'logoutuser/:type?',
      callee: 'logoutuser/all',
      test: {
        type: 'all'
      }
    }, {
      url: 'pepito',
      callee: 'pepito',
      test: {}
    }, {
      url: 'test/:arg/:arg2',
      callee: 'test/hola/mundo',
      test: {
        arg: 'hola',
        arg2: 'mundo'
      }
    }, {
      url: 'test/:arg/:optional?',
      callee: 'test/hola',
      test: {
        arg: 'hola',
        optional: null
      }
    }, {
      url: 'test/:arg/:optional?',
      callee: 'test/hola/mundo',
      test: {
        arg: 'hola',
        optional: 'mundo'
      }
    }, {
      url: 'user/:optional?/:arg/name',
      callee: 'user/hey/name',
      test: {
        optional: null,
        arg: 'hey'
      }
    }, {
      url: 'user/:optional?/:arg/name',
      callee: 'user/hey/ho/name',
      test: {
        optional: 'hey',
        arg: 'ho'
      }
    }, {
      url: 'user/:name',
      callee: 'user/onix-from-MySupplier-1437644873433-1437644873433',
      test: {
        name: 'onix-from-MySupplier-1437644873433-1437644873433'
      }
    }];

    before(function() {
      urls = urls.map(function(urlData) {
        urlData.regexpReference = regexpGenerator.regexpReference(urlData.url);
        return urlData;
      });
    });

    it('Extracts all the params', function() {


      urls.forEach(function(urlData) {
        var params = paramsExtractor.extract(urlData.callee, urlData.regexpReference);

        Object.keys(urlData.test).forEach(function(key){
          expect(params[key]).to.equals(urlData.test[key]);
        });

      });
    });


  });

});