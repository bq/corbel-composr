'use strict'

var corbelConnection = require('./corbelConnection')
var amqp = require('amqplib')
var uuid = require('uuid')
var ComposrError = require('./ComposrError')
var config = require('./config')
var logger = require('../utils/composrLogger')
var hub = require('./hub')
var utils = require('../utils/phraseUtils')

function Worker (engine) {
  if (!this.isValidEngine(engine)) {
    throw new ComposrError('error:worker:engine', 'invalid engine', 422)
  }
  this.engine = engine
  this.connUrl = 'amqp://' + encodeURIComponent(config('rabbitmq.username')) + ':' +
    encodeURIComponent(config('rabbitmq.password')) + '@' +
    config('rabbitmq.host') + ':' + config('rabbitmq.port') + '?heartbeat=' +
    config('rabbitmq.heartbeat')

  logger.info('RabbitMQ heartbeat at', config('rabbitmq.heartbeat'))

  this.workerID = uuid.v4()
  this.connectionStatus = false
}

Worker.prototype.isValidEngine = function (engine) {
  return !(!engine) && (engine.hasOwnProperty('composr') &&
  engine.hasOwnProperty('snippetsCollection') &&
  engine.hasOwnProperty('phrasesCollection'))
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
  var itemToAdd
  var that = this
  return this.engine.composr.loadPhrase(id)
    .then(function (item) {
      logger.debug('RabbitMQ-worker phrase fetched', item.id)
      itemToAdd = item
      return that.engine.composr.Phrases.register(domain, item)
    })
    .then(function (result) {
      if (result.registered === true) {
        that.engine.composr.addPhrasesToDataStructure(itemToAdd)
      }
      return result.registered
    })
}

/* *********************************
 * Fired when an event of CREATE snippet gets received
 * Returns Promise
 ***********************************/
Worker.prototype._addSnippet = function (domain, id) {
  var itemToAdd
  var that = this
  return this.engine.composr.loadSnippet(id)
    .then(function (item) {
      logger.debug('RabbitMQ-worker snippet fetched', item.id)
      itemToAdd = item
      return that.engine.composr.Snippets.register(domain, item)
    })
    .then(function (result) {
      if (result.registered === true) {
        that.engine.composr.addSnippetsToDataStructure(itemToAdd)
      }
      return result.registered
    })
}

/* *********************************
 * Fired when an event of DELETE phrase gets received
 ***********************************/
Worker.prototype._removePhrase = function (domain, id) {
  this.engine.composr.Phrases.unregister(domain, id)
  this.engine.composr.removePhrasesFromDataStructure(id)
}

/* *********************************
 * Fired when an event of DELETE snippet gets received
 ***********************************/
Worker.prototype._removeSnippet = function (domain, id) {
  this.engine.composr.Snippets.unregister(domain, id)
  this.engine.composr.removeSnippetsFromDataStructure(id)
}

Worker.prototype._doWorkWithPhraseOrSnippet = function (itemIsPhrase, id, action) {
  var domain = utils.extractDomainFromId(id)
  switch (action) {
    case 'DELETE':
      logger.info('RabbitMQ-worker triggered DELETE event', id, 'domain:' + domain)

      if (itemIsPhrase) {
        this._removePhrase(domain, id)
      } else {
        this._removeSnippet(domain, id)
      }
      break

    case 'CREATE':
    case 'UPDATE':
      logger.info('RabbitMQ-worker triggered CREATE or UPDATE event', id, 'domain:' + domain)

      var promise = itemIsPhrase ? this._addPhrase(domain, id) : this._addSnippet(domain, id)

      promise
        .then(function (registered) {
          logger.info('RabbitMQ-worker item registered', id, registered)
        })
        .catch(function (err) {
          logger.error('RabbitMQ-worker error: ', err.data.error, err.data.errorDescription, err.status)
        })

      break

    default:
      logger.warn('RabbitMQ-worker error: wrong action ', action)
  }
}

Worker.prototype.doWork = function (ch, msg) {
  if (msg.fields.routingKey === config('rabbitmq.event')) {
    var message
    try {
      message = JSON.parse(msg.content.toString('utf8'))
    } catch (error) {
      // ch.nack(error, false, false)
      throw new ComposrError('error:worker:message', 'Error parsing message: ' + error, 422)
    }
    var type = message.type
    if (this.isPhrase(type) || this.isSnippet(type)) {
      var itemIsPhrase = this.isPhrase(type)
      logger.info('RabbitMQ-worker ' + itemIsPhrase ? 'phrases' : 'snippet' + ' event:', message)
      this._doWorkWithPhraseOrSnippet(itemIsPhrase, message.resourceId, message.action)
    }
  }
}

Worker.prototype.createChannel = function (connection) {
  var that = this
  var queue = config('serverName') + that.workerID
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
    logger.error('RabbitMQ-worker closing connection')
    that.connectionStatus = false
    process.exit(code)
  })
}

Worker.prototype._connect = function () {
  return amqp.connect(this.connUrl)
}

Worker.prototype.retryInit = function (waitTime) {
  var time = waitTime | config('rabbitmq.reconntimeout')
  var that = this
  return setTimeout(function () {
    that.init()
  }, time)
}

Worker.prototype.init = function () {
  var conn
  var that = this
  logger.info('Creating RabbitMQ-worker with ID', that.workerID)

  that._connect()
    .then(function (connection) {
      // Bind connection errror
      connection.on('error', function (error) {
        hub.emit('rabbitmq:error', error)
        logger.error('RabbitMQ-worker on uncaught error:', error)
        that.connectionStatus = false
      })

      connection.once('close', function (error) {
        logger.error('RabbitMQ-worker on connection closed', error)
        that.connectionStatus = false
        that.retryInit(4000)
      })

      conn = connection
      that._closeConnectionSIGINT(connection)
      that.createChannel(connection)
        .then(function () {
          that.connectionStatus = true
          logger.info('RabbitMQ-worker up, with ID', that.workerID)
          // emit loaded worker
          hub.emit('load:worker')
        })
        .catch(function (error) {
          logger.error('RabbitMQ-worker error creating channel', error, 'with ID', that.workerID)
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
      logger.error('RabbitMQ-worker error connecting %s with ID : %s', err, that.workerID)
      that.retryInit()
    })
}

module.exports = Worker
