'use strict';

var regexpGenerator = require('../../../src/lib/regexpGenerator.js'),
  chai = require('chai'),
  expect = chai.expect;

describe('in regexpGenerator module', function() {

  describe('Get the correct url regexp for a set of phrase urls', function(){
    var urls = [
      {
        url : '',
        test : ['', '/'],
        testfail : ['asdad', 'as/', '-1', '/as/asd/asdas'],
        regexp : '^$|^/$'
      },{
        url : ':param',
        test : ['param', 'param/'],
        testfail : ['', '/', 'asdd/asdsad', '/as/asd/asdas'],
        regexp : '^\\w+\/?$' 
      },{
        url : 'logoutuser/:type?',
        test : ['logoutuser/all', 'logoutuser/', 'logoutuser'],
        testfail : ['', '/', 'asdd/asdsad', 'logoutuser/asdsa/asdsad'],
        regexp : 'logoutuser(\/(\\w+\/?)?)?$'

      },{
        url : 'pepito',
        test : 'pepito',
        testfail : ['asdad', '/', '-1', '/as/asd/asdas'],
        regexp : 'pepito'
      },{
        url : 'test/:arg/:arg2',
        test : 'test/param/param',
        testfail : ['asdad', '/', '-1', '/test/asd/', 'test/asdad', 'test/adsad/asdasd/adssad'],
        regexp : 'test\/\\w+\/?\/\\w+\/?$'
      },{
        url : 'test/:arg/:optional?',
        test : ['test/arg/arg', 'test/arg', 'test/arg'],
        testfail : ['asdad', '/', '-1', '/test/asd/asdas/asdad'],
        regexp : 'test\/\\w+\/?(\/(\\w+\/?)?)?$'
      },{
        url : 'user/:arg?/:optional/name',
        test : ['user/arg/name', 'user/arg/arg/name'],
        testfail : ['asdad', '/', '-1', 'user/asdasd/asda/paquito/name', 'user/asdasd/asda/paquito'],
        regexp : 'user(\/\\w+\/?)?\/\\w+\/?\/name'
      }
    ];

    it('Parses correctly all the url types', function() {
      urls.forEach(function(urlData){
        var regexpString = regexpGenerator.regexpUrl(urlData.url);
        expect(regexpString).to.equals(urlData.regexp);
        
        var regexp = new RegExp(regexpString);

        if(typeof(urlData.test) === 'object'){
          urlData.test.forEach(function(test){
            expect(regexp.test(test)).to.equals(true);
          });
        }else{
          expect(regexp.test(urlData.test)).to.equals(true);
        }
      });
    });

    it('Should reject the expression of the url when expected', function(){
      urls.forEach(function(urlData){
        var regexp = new RegExp(urlData.regexp);
        urlData.testfail.forEach(function(test){
          expect(regexp.test(test)).to.equals(false);
        });
       
      });
    });

  });

});
