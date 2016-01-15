'use strict'

/* ************************************
  Bunyan Logger
**************************************/
var bunyan = require('bunyan')
var bsyslog = require('bunyan-syslog')
var restify = require('restify')
var config = require('../lib/config')
var logStreamer = config('bunyan.streamServer')
var folderMaker = require('./folderMaker')

var logger = null

if (config('bunyan.log') === true) {
  folderMaker.makePath('./logs')

  var streams = [{
    level: 'error',
    type: 'rotating-file',
    period: '1d',   // daily rotation
    count: 3,        // keep 3 back copies
    path: './logs/api-error.log' // log ERROR and above to a file
  }, {
    level: 'trace',
    type: 'rotating-file',
    period: '1d',   // daily rotation
    count: 3,        // keep 3 back copies
    path: './logs/api.log'
  }]

  if (config('bunyan.stdout') === true) {
    streams.push({
      level: 'debug', // Loggin depth
      stream: process.stdout // log INFO and above to stdout
    })
  }

  if(config('bunyan.syslog') === true){
    streams.push({
      level: 'debug',
      type: 'raw',
      stream: bsyslog.createBunyanStream({
          type: 'sys',
          facility: bsyslog.local0,
          host: '127.0.0.1',
          port: 514
      })
    })
  }

  if (logStreamer) {
    //TODO: make it work
    /* var io = require('socket.io-client')
    var socket = io.connect(logStreamer)
    var ss = require('socket.io-stream')

    var socketLoggerStream = ss.createStream()
    var bunyanStreamConfig = {
      level: 'debug',
      stream: socketLoggerStream
    }

    streams.push(bunyanStreamConfig)*/

    /*socket.on('reconnect', function () {
      
        
      console.log(_server.log.streams)
      var socketLoggerStream = ss.createStream()
      var bunyanStreamConfig = {
        level: 'debug',
        stream: socketLoggerStream
      }
      _server.log.streams[0] = bunyanStreamConfig
      ss(socket).emit('log-stream', socketLoggerStream, {
        server: config('serverID')
      });
    })*/

    /* ss(socket).emit('log-stream', socketLoggerStream, {
      server: config('serverID')
    })*/
  }

  logger = bunyan.createLogger({
    name: config('serverName'), // Logs server name
    streams: streams,
    serializers: restify.bunyan.serializers
  })
}

module.exports = logger
