/*************************************
  Server Config and Load
**************************************/
var bunyan = require('bunyan');
var restify = require('restify');
var config = require('../lib/config');
var logStreamer = config('logStreamer');


var _server = {
  name: config('serverName') // Server Name
};

if (config('requestLog') === true) {

  var streams = [{
    level: 'debug', // Loggin depth
    stream: process.stdout // log INFO and above to stdout
  }, {
    level: 'error',
    path: './logs/api-error.log' // log ERROR and above to a file
  }, {
    level: 'trace',
    path: './logs/api.log'
  }];


  if (logStreamer) {
    var io = require('socket.io-client');
    var socket = io.connect(logStreamer);
    var ss = require('socket.io-stream');

    var socketLoggerStream = ss.createStream();
    var bunyanStreamConfig = {
      level: 'debug',
      stream: socketLoggerStream
    };

    streams.push(bunyanStreamConfig);

    socket.on('reconnect', function(){
      console.log(_server.log.streams);
      var socketLoggerStream = ss.createStream();
      var bunyanStreamConfig = {
        level: 'debug',
        stream: socketLoggerStream
      };
      _server.log.streams[0] = bunyanStreamConfig;
      ss(socket).emit('log-stream', socketLoggerStream, {
        server: config('serverID')
      });
    });

    ss(socket).emit('log-stream', socketLoggerStream, {
      server: config('serverID')
    });
  }


  _server = {
    name: config('serverName'), // Server Name
    log: bunyan.createLogger({
      name: config('serverName'), // Logs server name
      streams: streams,
      serializers: restify.bunyan.serializers
    })
  };
}

module.exports = _server;