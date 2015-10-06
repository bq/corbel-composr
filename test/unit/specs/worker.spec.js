'use strict';

var chai = require('chai'),
  expect = chai.expect,
  worker = require('../../../src/lib/worker.js');

describe('Rabbit worker', function() {

  it('has the expected API', function(){
    expect(worker).to.respondTo('init');
  });

  //TODO add test for : 
  
  it.skip('retriggers the connection creation if it fails', function(){

  });

  it.skip('Binds to a channel if the connection is stablished', function(){

  });

  it.skip('Parses a phrase event', function(){

  });

  it.skip('Parses a snippet event', function(){

  });
});