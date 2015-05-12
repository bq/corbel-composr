'use strict';

var uid = require('uuid');
var _ = require('lodash');

function ComposerProcess(cb){
  this.created = new Date();
  this.state = 'free';
  this.uid = uid.v1();
  this.process = require('child_process').fork('./src/lib/phraseProcess.js');
  this.cb = cb;

  // SIGTERM AND SIGINT will trigger the exit event.
  this.process.once('SIGTERM', function () {
    this.process.exit(0);
  }.bind(this));

  this.process.once('SIGINT', function () {
    this.process.exit(0);
  }.bind(this));

  // And the exit event shuts down the child.
  this.process.once('exit', function () {
    cb(this);
  }.bind(this));

}

ComposerProcess.prototype.end = function(){
  this.state = 'completed';
  this.ended = new Date();
  this.process.kill('SIGINT');
  console.log('Child process executed: Took', this.ended.valueOf() - this.created.valueOf(), 'ms');
};

ComposerProcess.prototype.use = function(actorIdentifier){
  this.state = 'used';
  this.actor = actorIdentifier;
};

ComposerProcess.prototype.slim = function(){
  return _.pick(this, 'state', 'actor', 'created', 'ended', 'uid');
};

module.exports = ComposerProcess;
