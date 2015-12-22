'use strict'

/* ************************************
  Bunyan Logger
**************************************/
var bunyan = require('bunyan')
var restify = require('restify')
var config = require('../lib/config')
var logStreamer = config('bunyan.streamServer')

var logger = null

if (config('bunyan.log') === true) {
  var streams = [{
    level: 'error',
    path: './logs/api-error.log' // log ERROR and above to a file
  }, {
    level: 'trace',
    path: './logs/api.log'
  }]

  if (config('bunyan.stdout') === true) {
    streams.push({
      level: 'debug', // Loggin depth
      stream: process.stdout // log INFO and above to stdout
    })
  }

  if (logStreamer) {
    var io = require('socket.io-client')
    var socket = io.connect(logStreamer)
    var ss = require('socket.io-stream')

    var socketLoggerStream = ss.createStream()
    var bunyanStreamConfig = {
      level: 'debug',
      stream: socketLoggerStream
    }

    streams.push(bunyanStreamConfig)

    socket.on('reconnect', function () {
      /*
        TODO: make it work
      console.log(_server.log.streams)
      var socketLoggerStream = ss.createStream()
      var bunyanStreamConfig = {
        level: 'debug',
        stream: socketLoggerStream
      }
      _server.log.streams[0] = bunyanStreamConfig
      ss(socket).emit('log-stream', socketLoggerStream, {
        server: config('serverID')
      });*/
    })

    ss(socket).emit('log-stream', socketLoggerStream, {
      server: config('serverID')
    })
  }

  logger = bunyan.createLogger({
    name: config('serverName'), // Logs server name
    streams: streams,
    serializers: restify.bunyan.serializers
  })
}

module.exports = logger
