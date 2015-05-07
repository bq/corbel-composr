"use strict";

//Store the processes for further killing and monitoring
var processesList = [];

function executePhrase(phrase, req, response, next, iamToken){

  //Instantiate a new child process with the phrase process code
  var proc = require('child_process').fork('./src/lib/phraseProcess.js');
  var start = new Date();

  //Listener for the response of the child process execution
  proc.on('message', function (data) {
    var end = new Date();
    console.log('Phrase executed: Took', end.valueOf() - start.valueOf());

    //Switch over possible callback executions of the phrase
    switch(data.trigger){
      case 'res':
        //Call the real response object
        response[data.type].apply(response,data.args);
      break;

      case 'next':
        //Call the real "next" object
        next(data.err);
      break;

      case 'err':
        //TODO: kill process and send 500
        response.send(500);
      break;
    }
  });

  //Send the necessary data to the child process for the phrase execution
  proc.send({
    body: req.body,
    params: req.params,
    phrase : phrase,
    iamToken: iamToken
  });

  //Store the process on the request object for future reference or destroying it
  req.process = proc;

  //Store the process on the list of current active processes
  processesList.push(proc);
}


module.exports = {
  executePhrase : executePhrase
}
