'use strict'

var corbelConnection = require('./connectors/corbel')
var amqp = require('amqplib')
var config = require('config')
var logger = require('../utils/composrLogger')
var hub = require('./hub')
var utils = require('../utils/phraseUtils')

function Worker (engine, serverID) {
  this.engine = engine
  this.connUrl = 'amqp://' + encodeURIComponent(config.get('rabbitmq.username')) + ':' +
    encodeURIComponent(config.get('rabbitmq.password')) + '@' +
    config.get('rabbitmq.host') + ':' + config.get('rabbitmq.port') + '?heartbeat=' +
    config.get('rabbitmq.heartbeat')

  logger.debug('[RabbitMQ Eworker]', 'RabbitMQ heartbeat at', config.get('rabbitmq.heartbeat'))

  this.workerID = serverID
  this.connectionStatus = false
}

Worker.prototype.canConnect = function () {
  return config.get('rabbitmq.host') && config.get('rabbitmq.port') &&
  config.get('rabbitmq.username') && config.get('rabbitmq.password')
}

Worker.prototype.isPhrase = function (type) {
  return type === corbelConnection.PHRASES_COLLECTION
}

Worker.prototype.isSnippet = function (type) {
  return type === corbelConnection.SNIPPETS_COLLECTION
}

/* *********************************
 * Fired when an event of CREATE phrase gets received
 * Returns Promise
 ***********************************/
Worker.prototype._addPhrase = function (domain, id) {
  return this.engine.composr.Phrase.load(id)
    .then(function (item) {
      logger.debug('[RabbitMQ Eworker]', 'RabbitMQ-worker phrase fetched', item.id, 'registered', item.registered)
      return item.registered
    })
}

/* *********************************
 * Fired when an event of CREATE snippet gets received
 * Returns Promise
 ***********************************/
Worker.prototype._addSnippet = function (domain, id) {
  return this.engine.composr.Snippet.load(id)
    .then(function (item) {
      logger.debug('[RabbitMQ Eworker]', 'RabbitMQ-worker snippet fetched', item.id, 'registered', item.registered)
      return item.registered
    })
}

/* *********************************
 * Fired when an event of DELETE phrase gets received
 ***********************************/
Worker.prototype._removePhrase = function (domain, id) {
  this.engine.composr.Phrase.unregister(domain, id)
}

/* *********************************
 * Fired when an event of DELETE snippet gets received
 ***********************************/
Worker.prototype._removeSnippet = function (domain, id) {
  this.engine.composr.Snippet.unregister(domain, id)
}

Worker.prototype._doWorkWithPhraseOrSnippet = function (itemIsPhrase, id, action) {
  var domain = utils.extractDomainFromId(id)
  switch (action) {
    case 'DELETE':
      logger.info('[RabbitMQ Eworker]', 'RabbitMQ-worker triggered DELETE event', id, 'domain:' + domain)

      if (itemIsPhrase) {
        this._removePhrase(domain, id)
      } else {
        this._removeSnippet(domain, id)
      }
      break

    case 'CREATE':
    case 'UPDATE':
      logger.info('[RabbitMQ Eworker]', 'RabbitMQ-worker triggered CREATE or UPDATE event', id, 'domain:' + domain)

      var promise = itemIsPhrase ? this._addPhrase(domain, id) : this._addSnippet(domain, id)

      promise
        .then(function (registered) {
          logger.info('[RabbitMQ Eworker]', 'RabbitMQ-worker item registered', id, registered)
        })
        .catch(function (err) {
          logger.error('[RabbitMQ Eworker]', 'RabbitMQ-worker error: ', err.data.error, err.data.errorDescription, err.status)
        })

      break

    default:
      logger.warn('[RabbitMQ Eworker]', 'RabbitMQ-worker error: wrong action ', action)
  }
}

Worker.prototype.doWork = function (ch, msg) {
  if (msg.fields.routingKey === config.get('rabbitmq.event')) {
    var message
    try {
      message = JSON.parse(msg.content.toString('utf8'))
    } catch (error) {
      // ch.nack(error, false, false)
      throw new Error('error:worker:message Error parsing message: ' + error)
    }
    var type = message.type
    if (this.isPhrase(type) || this.isSnippet(type)) {
      var itemIsPhrase = this.isPhrase(type)
      logger.info('[RabbitMQ Eworker]', 'RabbitMQ-worker ' + itemIsPhrase ? 'phrases' : 'snippet' + ' event:', message)
      this._doWorkWithPhraseOrSnippet(itemIsPhrase, message.resourceId, message.action)
    }
  }
}

Worker.prototype.createChannel = function (connection) {
  var that = this
  var queue = config.get('serverName') + that.workerID
  var channel

  return connection.createChannel()
    .then(function (ch) {
      channel = ch
      return that.assertQueue(channel, queue)
    })
    .then(function () {
      return that.bindQueue(channel, queue)
    })
    .then(function () {
      return that.consumeChannel(channel, queue)
    })
}

Worker.prototype.assertQueue = function (ch, queue) {
  return ch.assertQueue(queue, {
    durable: false,
    autoDelete: true
  })
}

Worker.prototype.bindQueue = function (ch, queue) {
  var exchange = 'eventbus.exchange'
  var pattern = ''

  return ch.bindQueue(queue, exchange, pattern)
}

Worker.prototype.consumeChannel = function (ch, queue) {
  var that = this
  return ch.consume(queue, function (message) {
    // Added callback function in case we need to do manual ack of the messages
    that.doWork(ch, message)
  },
    Object.create({
      noAck: true
    }))
}

Worker.prototype._closeConnectionSIGINT = function (connection) {
  var that = this
  process.once('SIGINT', function () {
    that._closeConnection(connection, 0)
  })
}

Worker.prototype._closeConnection = function (connection, exitCode) {
  var that = this
  var code = exitCode | 1
  connection.close(function () {
    logger.error('[RabbitMQ Eworker]', 'RabbitMQ-worker closing connection')
    that.connectionStatus = false
    process.exit(code)
  })
}

Worker.prototype._connect = function () {
  return amqp.connect(this.connUrl)
}

Worker.prototype.retryInit = function (waitTime) {
  var time = waitTime | config.get('rabbitmq.reconntimeout')
  var that = this
  return setTimeout(function () {
    that.init()
  }, time)
}

Worker.prototype.init = function (cb) {
  var conn
  var that = this
  logger.info('[RabbitMQ Eworker]', 'Creating RabbitMQ-worker with ID', that.workerID)

  that._connect()
    .then(function (connection) {
      // Bind connection errror
      connection.on('error', function (error) {
        hub.emit('rabbitmq:error', error)
        logger.error('[RabbitMQ Eworker]', 'RabbitMQ-worker on uncaught error:', error)
        that.connectionStatus = false
      })

      connection.once('close', function (error) {
        logger.error('[RabbitMQ Eworker]', 'RabbitMQ-worker on connection closed', error)
        that.connectionStatus = false
        that.retryInit(4000)
      })

      conn = connection
      that._closeConnectionSIGINT(connection)
      that.createChannel(connection)
        .then(function () {
          that.connectionStatus = true
          logger.info('[RabbitMQ Eworker]', 'RabbitMQ-worker up, with ID', that.workerID)
          // emit loaded worker
          if (cb) {
            cb()
          }
        })
        .catch(function (error) {
          logger.error('[RabbitMQ Eworker]', 'RabbitMQ-worker error creating channel', error, 'with ID', that.workerID)
          if (conn) {
            that._closeConnection(conn)
          // @TODO: If cannot create channel, retry N times to create channel.
          // If after N times channel cannot be created, delete connection and retryInit.
          } else {
            that.retryInit()
          }
        })
    })
    .then(null, function (err) {
      logger.error('[RabbitMQ Eworker]', 'RabbitMQ-worker error connecting %s with ID : %s', err, that.workerID)
      that.retryInit()
    })
}

module.exports = Worker
