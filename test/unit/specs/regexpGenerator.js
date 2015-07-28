'use strict';

var regexpGenerator = require('../../../src/lib/regexpGenerator.js'),
  chai = require('chai'),
  expect = chai.expect,
  XRegExp = require('xregexp').XRegExp;

describe('in regexpGenerator module', function() {

  describe('Get the correct url regexp for a set of phrase urls', function() {
    var urls = [{
      url: '',
      test: ['', '/'],
      testfail: ['asdad', 'as/', '-1', '/as/asd/asdas'],
      regexp: '^$|^/$',
      params: []
    }, {
      url: ':param',
      test: ['param', 'param/', '/param', '/param/'],
      testfail: ['', '/', 'asdd/asdsad', '/as/asd/asdas'],
      regexp: '^\/?(?<param>[\\w-._~:?#\\[\\]@!$&()*+,;=!]+)\/?$',
      params: ['param']
    }, {
      url: ':param?',
      test: ['param', 'param/', '', '/'],
      testfail: ['optional/single', '/as/asd/asdas'],
      regexp: '^\/?((?<param>[\\w-._~:?#\\[\\]@!$&()*+,;=!]+)\/?)?$',
      params: ['param']
    }, {
      url: 'logoutuser/:type?',
      test: ['logoutuser/all', 'logoutuser/', 'logoutuser', '/logoutuser/'],
      testfail: ['', '/', 'asdd/asdsad', 'logoutuser/asdsa/asdsad'],
      regexp: '\/?logoutuser(\/((?<type>[\\w-._~:?#\\[\\]@!$&()*+,;=!]+)\/?)?)?$',
      params: ['type']
    }, {
      url: 'pepito',
      test: ['pepito', '/pepito', 'pepito/', '/pepito/'],
      testfail: ['asdad', '/', '-1', '/as/asd/asdas', 'pepito/asd'],
      regexp: '\/?pepito\/?$',
      params: []
    }, {
      url: 'test/:arg/:arg2',
      test: ['test/param/param', '/test/param/param', '/test/param/param/'],
      testfail: ['asdad', '/', '-1', '/test/asd/', 'test/asdad', 'test/adsad/asdasd/adssad'],
      regexp: '\/?test\/(?<arg>[\\w-._~:?#\\[\\]@!$&()*+,;=!]+)\/?\/(?<arg2>[\\w-._~:?#\\[\\]@!$&()*+,;=!]+)\/?$',
      params: ['arg', 'arg2']
    }, {
      url: 'test/:arg/:optional?',
      test: ['test/arg/arg', 'test/arg', 'test/arg', '/test/arg/', '/test/arg/arg/'],
      testfail: ['asdad', '/', '-1', '/test/asd/asdas/asdad'],
      regexp: '\/?test\/(?<arg>[\\w-._~:?#\\[\\]@!$&()*+,;=!]+)\/?(\/((?<optional>[\\w-._~:?#\\[\\]@!$&()*+,;=!]+)\/?)?)?$',
      params: ['arg', 'optional']
    }, {
      url: 'user/:arg?/:optional/name',
      test: ['user/arg/name', 'user/arg/arg/name', '/user/arg/name', '/user/arg/arg/name', '/user/arg/arg/name/'],
      testfail: ['asdad', '/', '-1', 'user/asdasd/asda/paquito/name', 'user/asdasd/asda/paquito', '/user/arg/name/asda'],
      regexp: '\/?user(\/(?<arg>[\\w-._~:?#\\[\\]@!$&()*+,;=!]+)\/?)?\/(?<optional>[\\w-._~:?#\\[\\]@!$&()*+,;=!]+)\/?\/name\/?$',
      params: ['arg', 'optional']
    }, {
      url: 'user/:arg',
      test: ['user/onix-from-MySupplier-1437644873433-1437644873433'],
      testfail: [],
      regexp: '\/?user\/(?<arg>[\\w-._~:?#\\[\\]@!$&()*+,;=!]+)\/?$',
      params: ['arg']
    }];

    it('Parses correctly all the url types', function() {
      urls.forEach(function(urlData) {
        var regexpString = regexpGenerator.regexpUrl(urlData.url);
        expect(regexpString).to.equals(urlData.regexp);

        var regexp = XRegExp(regexpString);

        urlData.test.forEach(function(test) {
          expect(XRegExp.test(test, regexp)).to.equals(true);
          var result = XRegExp.exec(test, regexp);

          //See if it stores all the params
          urlData.params.forEach(function(param) {
            expect(result).to.have.any.keys(param);
          });
        });


      });
    });

    it('Should reject the expression of the url when expected', function() {
      urls.forEach(function(urlData) {
        var regexpString = regexpGenerator.regexpUrl(urlData.url);
        var regexp = XRegExp(regexpString);

        urlData.testfail.forEach(function(test) {
          expect(XRegExp.test(test, regexp)).to.equals(false);
        });

      });
    });

    describe('Arguments extraction', function() {
      var urls = [{
        url: ':param',
        params: ['param']
      }, {
        url: ':arg/:arg2',
        params: ['arg', 'arg2']
      }, {
        url: ':arg/:optional?',
        params: ['arg', 'optional?']
      }];

      it('Gets all the arguments', function() {
        urls.forEach(function(urlData) {
          var regexpReference = regexpGenerator.regexpReference(urlData.url);
          expect(regexpReference.regexp).to.be.a('string');
          expect(regexpReference.params).to.be.an('array');

          urlData.params.forEach(function(param) {
            expect(regexpReference.params.indexOf(param)).to.not.equals(-1);
          });
        });
      });

    });

    describe('Arguments extraction from urls', function() {
      var urls = [{
        url: ':param',
        test: [{
          path: '/hey',
          result: {
            param: 'hey'
          }
        }, {
          path: '/ho',
          result: {
            param: 'ho'
          }
        }]
      }, {
        url: ':arg/:optional?',
        test: [{
          path: '/hey',
          result: {
            arg: 'hey',
            optional: undefined
          }
        }, {
          path: '/hey/ho',
          result: {
            arg: 'hey',
            optional: 'ho'
          }
        }]
      }];

      it('Gets all the arguments', function() {
        urls.forEach(function(urlData) {
          var regexpReference = regexpGenerator.regexpReference(urlData.url);
          expect(regexpReference.regexp).to.be.a('string');
          expect(regexpReference.params).to.be.an('array');

          var regexp = XRegExp(regexpReference.regexp);

          urlData.test.forEach(function(test) {
            expect(XRegExp.test(test.path, regexp)).to.equals(true);
            var result = XRegExp.exec(test.path, regexp);

            //See if it stores all the params
            Object.keys(test.result).forEach(function(param) {
              expect(result).to.have.any.keys(param);
              expect(result[param]).to.equals(test.result[param]);
            });
          });
        });
      });

    });

  });

});