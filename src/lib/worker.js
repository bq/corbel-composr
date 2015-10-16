'use strict';

var engine = require('./engine'),
corbelConnection = require('./corbelConnection'),
amqp = require('amqplib'),
uuid = require('uuid'),
ComposrError = require('./ComposrError'),
config = require('./config'),
logger = require('../utils/logger');


function Worker(){
  this.connUrl =  'amqp://' + config('rabbitmq.username') + ':' + config('rabbitmq.password') + '@' + config('rabbitmq.host') + ':' + config('rabbitmq.port');
  this.workerID = uuid.v4();

}

Worker.prototype.phraseOrSnippet = function(type){
  return type === corbelConnection.PHRASES_COLLECTION ? true : false;
};

Worker.prototype._doWorkWithPhraseOrSnippet = function(isPhrase, id, action, engine){
  var domain = id.split('!')[0];
  switch (action) {
    case 'DELETE':
    if (isPhrase){
      engine.composr.Phrases.unregister(domain, id);
    }
    else{
      engine.composr.Snippets.unregister(domain, id);
    }
    //ch.ack(msg);
    break;

    case 'CREATE':
    case 'UPDATE':
    logger.debug('WORKER triggered create or update event', id, 'domain:' + domain);
    var promise;

    if(isPhrase){
      promise = engine.composr.loadPhrase(id);
    }else{
      promise = engine.composr.loadSnippet(id);
    }
    promise
    .then(function(item) {
      logger.debug('worker item fetched', item.id);
      if (isPhrase){
        return engine.composr.Phrases.register(domain, item);
      }
      else{
        return engine.composr.Snippets.register(domain, item);
      }
    })
    .then(function(result) {
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
    if ((type === corbelConnection.PHRASES_COLLECTION) ||
    (type === corbelConnection.SNIPPETS_COLLECTION)) {
      var isPhrase = this.phraseOrSnippet(type);
      logger.debug('WORKER ' + isPhrase? 'phrases':'snippet' + ' event:', message);
      this._doWorkWithPhraseOrSnippet(isPhrase,message.resourceId, message.action, engine);
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
  });
};

Worker.prototype._closeConnection = function(connection){
  connection.close(function() {
    process.exit(1);
  });
};

Worker.prototype._connect = function(){
  return amqp.connect(this.connUrl);
};

Worker.prototype.retryInit = function(){
  return setTimeout(this.init, config('rabbitmq.reconntimeout'));
};

Worker.prototype.init = function(){
  var conn;
  var that = this;
  logger.info('Creating worker with ID', that.workerID);
  that._connect()
  .then(function(connection) {
    conn = connection;
    that._closeConnectionSIGINT();
    that.createChannel(connection)
    .then(function() {
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
