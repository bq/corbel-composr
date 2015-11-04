'use strict';

var engine = require('./engine'),
corbelConnection = require('./corbelConnection'),
amqp = require('amqplib'),
uuid = require('uuid'),
ComposrError = require('./ComposrError'),
config = require('./config'),
logger = require('../utils/logger');


function Worker(){
  this.connUrl =  'amqp://' + encodeURIComponent(config('rabbitmq.username')) + ':' + encodeURIComponent(config('rabbitmq.password')) + '@' + config('rabbitmq.host') + ':' + config('rabbitmq.port');
  this.workerID = uuid.v4();
}

Worker.prototype.phraseOrSnippet = function(type){
  return type === corbelConnection.PHRASES_COLLECTION ? true : false;
};

Worker.prototype.isPhrase = function(type){
  return type === corbelConnection.PHRASES_COLLECTION;
};

Worker.prototype.isSnippet = function(type){
  return type === corbelConnection.SNIPPETS_COLLECTION;
};

Worker.prototype._doWorkWithPhraseOrSnippet = function(itemIsPhrase, id, action, engine){
  var domain = id.split('!')[0];
  switch (action) {
    case 'DELETE':
      if (itemIsPhrase) {
        engine.composr.Phrases.unregister(domain, id);
        engine.composr.removePhrasesFromDataStructure(id);
      } else {
        engine.composr.Snippets.unregister(domain, id);
        engine.composr.removeSnippetsFromDataStructure(id);
      }
      //ch.ack(msg);
      break;

    case 'CREATE':
    case 'UPDATE':
      logger.debug('WORKER triggered create or update event', id, 'domain:' + domain);
      var promise;
      var itemToAdd;

      if (itemIsPhrase) {
        promise = engine.composr.loadPhrase(id);
      } else {
        promise = engine.composr.loadSnippet(id);
      }
      promise
        .then(function(item) {
          logger.debug('worker item fetched', item.id);
          itemToAdd = item;
          if (itemIsPhrase) {
            return engine.composr.Phrases.register(domain, item);
          } else {
            return engine.composr.Snippets.register(domain, item);
          }
        })
        .then(function(result) {
          if (result.registered === true){
            if (itemIsPhrase) {
              engine.composr.addPhrasesToDataStructure(itemToAdd);
            } else {
              engine.composr.addSnippetsToDataStructure(itemToAdd);
            }
          }
          logger.debug('worker item registered', id, result.registered);
        })
        .catch(function(err) {
          logger.error('WORKER error: ', err.data.error, err.data.errorDescription, err.status);
        });
      break;

    default:
      logger.warn('WORKER error: wrong action ', action);
  }
};

Worker.prototype.doWork = function(ch, msg){
  if (msg.fields.routingKey === config('rabbitmq.event')) {
    var message;
    try {
      message = JSON.parse(msg.content.toString('utf8'));
    } catch (error) {
      //ch.nack(error, false, false);
      throw new ComposrError('error:worker:message', 'Error parsing message: ' + error, 422);
    }
    var type = message.type;
    if (this.isPhrase(type) || this.isSnippet(type)) {
      var itemIsPhrase = this.isPhrase(type);
      logger.debug('WORKER ' + itemIsPhrase ? 'phrases' : 'snippet' + ' event:', message);
      this._doWorkWithPhraseOrSnippet(itemIsPhrase, message.resourceId, message.action, engine);
    }
  }
};

Worker.prototype.createChannel = function(conn){
  var that = this;
  var queue = 'composer-' + that.workerID,
  exchange = 'eventbus.exchange',
  pattern = '';

  return conn.createChannel()
  .then(function(ch) {
    return ch.assertQueue(queue, {
      durable: false,
      autoDelete: true
    }).then(function() {
      return ch.bindQueue(queue, exchange, pattern);
    })
    .then(function() {
      ch.consume(queue, function(message) {
        //Added callback function in case we need to do manual ack of the messages
        that.doWork(ch, message);
      },
      Object.create({
        noAck: true
      }));
    });
  });
};

Worker.prototype._closeConnectionSIGINT = function(connection){
  process.once('SIGINT', function() {
    connection.close();
    process.exit();
    engine.setWorkerStatus(false);
  });
};

Worker.prototype._closeConnection = function(connection){
  connection.close(function() {
    process.exit(1);
    engine.setWorkerStatus(false);
  });
};

Worker.prototype._connect = function(){
  return amqp.connect(this.connUrl);
};

Worker.prototype.retryInit = function(){
  var that = this;
  return setTimeout(function(){ that.init();}, config('rabbitmq.reconntimeout'));
};

Worker.prototype.init = function(){
  var conn;
  var that = this;
  logger.info('Creating worker with ID', that.workerID);
  that._connect()
  .then(function(connection) {
    conn = connection;
    that._closeConnectionSIGINT(connection);
    that.createChannel(connection)
    .then(function() {
      engine.setWorkerStatus(true);
      logger.info('Worker up, with ID', that.workerID);
    })
    .catch(function(error) {
      logger.error('WORKER error ', error, 'with ID', that.workerID);
      if (conn) {
        that._closeConnection(conn);
      }
    });
  })
  .then(null, function(err) {
    logger.error('Worker error %s with ID : %s', err, that.workerID);
    that.retryInit();
  });
};

module.exports = Worker;
