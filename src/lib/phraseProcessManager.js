'use strict';

//Store the processes for further killing and monitoring
//TODO: instead of creating processes on the fly, store a pile of available processes,
//so we can have some settings for controlling the amount of running / reserved processes
//and control memory usages.
var _ = require('lodash');
var processesList = [];
var usedProcesses = [];
var FREE_PROCESSES = 3;
var ComposerProcess = require('../models/composerProcess');

function clearUsedProcess(pid){
  usedProcesses = _.filter(usedProcesses, function(item){
    return item.uid !== pid;
  });
}

function newProcess(){
  var proc = new ComposerProcess(function(proc){
    clearUsedProcess(proc.uid);
  });
  processesList.push(proc);
}

function getFreeProcess(actorIdentifier){
  var proc = processesList.pop();
  proc.use(actorIdentifier);
  usedProcesses.push(proc);

  //You get one, you give one
  newProcess();

  return proc;
}

function initializeProcesses(){
  for(var i = 0; i < FREE_PROCESSES; i++){
    newProcess();
  }
}

function executePhrase(phrase, req, response, next, iamToken){

  //Instantiate a new child process with the phrase process code
  var proc = getFreeProcess(phrase);

  //Listener for the response of the child process execution
  proc.process.on('message', function (data) {
    proc.end();

    //Switch over possible callback executions of the phrase
    switch(data.trigger){
      case 'res':
        //Call the real response object
        response[data.type].apply(response,data.args);
      break;

      case 'next':
        //Call the real 'next' object
        next(data.err);
      break;

      case 'err':
        proc.end();
        response.send(500);
      break;
    }
  });

  //Send the necessary data to the child process for the phrase execution
  proc.process.send({
    body: req.body,
    params: req.params,
    phrase : phrase,
    iamToken: iamToken
  });

  //Store the process on the request object for future reference or destroying it
  req.__proc = proc;

  //Kill the process if the connection dies
  req.connection.addListener('close', function () {
    // callback is fired when connection closed (e.g. closing the browser)
    proc.end();
  });
}

function getActiveProcesses(){
  return usedProcesses.map(function(item){
    return item.slim();
  });
}

module.exports = {
  executePhrase : executePhrase,
  getActiveProcesses: getActiveProcesses,
  initializeProcesses : initializeProcesses
};
