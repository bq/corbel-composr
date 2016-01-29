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
  this.connUrl = 'amqp://' + encodeURIComponent(config('rabbitmq.username')) + ':' + encodeURIComponent(config('rabbitmq.password')) + '@' + config('rabbitmq.host') + ':' + config('rabbitmq.port') + '?heartbeat=1'
  this.workerID = uuid.v4()
  this.engine = engine
  this.connectionStatus = false
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
      logger.debug('RabbitMQ-worker item fetched', item.id)
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
      logger.debug('RabbitMQ-worker item fetched', item.id)
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
      logger.debug('RabbitMQ-worker triggered DELETE event', id, 'domain:' + domain)

      if (itemIsPhrase) {
        this._removePhrase(domain, id)
      } else {
        this._removeSnippet(domain, id)
      }
      break

    case 'CREATE':
    case 'UPDATE':
      logger.debug('RabbitMQ-worker triggered CREATE or UPDATE event', id, 'domain:' + domain)

      var promise = itemIsPhrase ? this._addPhrase(domain, id) : this._addSnippet(domain, id)

      promise
        .then(function (registered) {
          logger.debug('RabbitMQ-worker item registered', id, registered)
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
      logger.debug('RabbitMQ-worker ' + itemIsPhrase ? 'phrases' : 'snippet' + ' event:', message)
      this._doWorkWithPhraseOrSnippet(itemIsPhrase, message.resourceId, message.action)
    }
  }
}

Worker.prototype.createChannel = function (conn) {
  var that = this
  var queue = config('serverName') + that.workerID
  var exchange = 'eventbus.exchange'
  var pattern = ''

  return conn.createChannel()
    .then(function (ch) {
      return ch.assertQueue(queue, {
        durable: false,
        autoDelete: true
      })
        .then(function () {
          return ch.bindQueue(queue, exchange, pattern)
        })
        .then(function () {
          ch.consume(queue, function (message) {
            // Added callback function in case we need to do manual ack of the messages
            that.doWork(ch, message)
          },
            Object.create({
              noAck: true
            }))
        })
    })
}

Worker.prototype._closeConnectionSIGINT = function (connection) {
  var that = this
  process.once('SIGINT', function () {
    logger.error('RabbitMQ-worker closing connection')
    connection.close()
    that.connectionStatus = false
    process.exit()
  })
}

Worker.prototype._closeConnection = function (connection) {
  var that = this
  connection.close(function () {
    logger.error('RabbitMQ-worker closing connection')
    that.connectionStatus = false
    process.exit(1)
  })
}

Worker.prototype._connect = function () {
  return amqp.connect(this.connUrl)
}

Worker.prototype.retryInit = function () {
  var that = this
  return setTimeout(function () {
    that.init()
  }, config('rabbitmq.reconntimeout'))
}

Worker.prototype.init = function () {
  var conn
  var that = this
  logger.info('Creating RabbitMQ-worker with ID', that.workerID)

  that._connect()
    .then(function (connection) {
      // Bind connection errror
      connection.on('error', function (error) {
        logger.error('RabbitMQ-worker', error)
        that.connectionStatus = false
        
        setTimeout(function(){
          that.init();
        }, 4000)
      })

      connection.on('close', function (error) {
        logger.error('RabbitMQ-worker connection closed', error)
        that.connectionStatus = false
        setTimeout(function(){
          that.init();
        }, 4000)
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
          logger.error('RabbitMQ-worker error channel', error, 'with ID', that.workerID)
          if (conn) {
            that._closeConnection(conn)
          }
          that.retryInit()
        })
    })
    .then(null, function (err) {
      logger.error('RabbitMQ-worker error connection %s with ID : %s', err, that.workerID)
      that.retryInit()
    })
}

module.exports = Worker
