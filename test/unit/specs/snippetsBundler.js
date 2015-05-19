'use strict';

var snippetsBundler = require('../../../src/lib/snippetsBundler.js'),
    chai = require('chai'),
    expect = chai.expect,
    assert = chai.assert,
    sinon = require('sinon');

describe('Single domain functions', function(){

  var functions = {
    '_silkroad' : [
      {
        name : 'log',
        code : 'console.log("ey");'
      }
    ],
    '_pepe': [
      {
        name : 'pepe',
        code : 'console.log("pepe");'
      },
      {
        name : 'pepe',
        code : 'console.log("francisco");'
      }
    ]
  };


  it('extracts the correct functions for the parent domain', function(){
    var domainSnippets = snippetsBundler.getDomainSnippets(functions, '_silkroad');
    expect(domainSnippets['log']).to.be.a('string');
    expect(domainSnippets['log']).to.be.equals('console.log("ey");');
  });

  it('overwrites the function if 2 snippets share the same name', function(){
    var domainSnippets = snippetsBundler.getDomainSnippets(functions, '_pepe');
    expect(domainSnippets['log']).to.be.undefined;
    expect(domainSnippets['pepe']).to.be.a('string');
    expect(domainSnippets['pepe']).to.be.equals('console.log("francisco");');
  });
});


describe('Domain hierarchy functions', function(){
  var functions = {
    '_silkroad' : [
      {
        name : 'log',
        code : 'console.log("ey");'
      },
      {
        name : 'parentFunction',
        code : 'return "wasabiiiiiiiiiiii";'
      }
    ],
    '_silkroad:domain': [
      {
        name : 'log',
        code : 'console.log("domain");'
      },
      {
        name : 'sum',
        code : 'return params.a + params.b;'
      }
    ],
    '_silkroad:domain:child': [
      {
        name : 'log',
        code : 'console.log("child");'
      },
      {
        name : 'child',
        code : 'debugger;'
      }
    ]
  };

  it('extracts the correct log function for the subdomain', function(){
    var domainSnippets = snippetsBundler.getDomainSnippets(functions, '_silkroad:domain');
    expect(domainSnippets['log']).to.be.a('string');
    expect(domainSnippets['log']).to.be.equals('console.log("domain");');
    expect(domainSnippets['parentFunction']).to.be.a('string');
  });

  it('does not get the child functions', function(){
    var domainSnippets = snippetsBundler.getDomainSnippets(functions, '_silkroad:domain');
    expect(domainSnippets['child']).to.be.undefined;
  });

  it('gets all the hierarchy back', function(){
    var domainSnippets = snippetsBundler.getDomainSnippets(functions, '_silkroad:domain:child');
    expect(domainSnippets['child']).to.be.a('string');
    expect(domainSnippets['sum']).to.be.a('string');
    expect(domainSnippets['log']).to.be.a('string');
    expect(domainSnippets['log']).to.be.equals('console.log("child");');
  });

});


describe('Snippets bundling', function(){
  var functions = {
    '_silkroad' : [
      {
        name : 'log',
        code : 'console.log("ey");'
      },
      {
        name : 'example',
        code : 'compoSR.run("log");'
      }
    ]
  };

  it('should be able to call the log function', function(){
    var compoSR = snippetsBundler.getRunner('_silkroad:domain', functions);
    var spy = sinon.spy(compoSR, 'run');

    expect(compoSR.run).to.be.a('function');
    compoSR.run('log');
    expect(spy.calledOnce).to.equals(true);
    expect(spy.calledWith('log')).to.equals(true);
  });

  it('should be able to call the log function from other snippets', function(){
    var compoSR = snippetsBundler.getRunner('_silkroad:domain', functions);
    var spy = sinon.spy(compoSR, 'run');

    compoSR.run('example');
    expect(spy.calledTwice).to.equals(true);
    expect(spy.calledWith('log')).to.equals(true);
  });

});
