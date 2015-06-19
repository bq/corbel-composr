'use strict';

var phraseManager = require('./phraseManager'),
  connection = require('./corbelConnection'),
  amqp = require('amqplib'),
  uuid = require('uuid'),
  q = require('q'),
  ComposerError = require('./composerError'),
  config = require('./config'),
  logger = require('../utils/logger');

var worker = function() {
  var dfd = q.defer();

  var connUrl = 'amqp://' + config('rabbitmq.username') + ':' + config('rabbitmq.password') + '@' + config('rabbitmq.host') + ':' + config('rabbitmq.port');

  var id = Date.now();

  logger.debug('WORKER', 'created worker with id', id);

  amqp.connect(connUrl).then(function(conn) {
    logger.debug('WORKER Connected: ', id);

    function doWork(ch, msg) {
      if (msg.fields.routingKey === config('rabbitmq.event')) {

        var message;
        try {
          message = JSON.parse(msg.content.toString());
        } catch (error) {
          //ch.nack(error, false, false);
          throw new ComposerError('error:worker:message', 'Error parsing message: ' + error, 422);
        }

        if (message.type === connection.PHRASES_COLLECTION) {
          logger.debug('WORKER mesage', message);
          switch (message.action) {
            case 'DELETE':

              phraseManager.unregisterPhrase({
                id: message.resourceId
              });

              //ch.ack(msg);
              break;

            default: // 'CREATE' or 'UPDATE'
              logger.debug('WORKER triggered create or update event', message.resourceId);

              connection.driver.then(function(driver) {
                  return driver.resources.resource(connection.PHRASES_COLLECTION, message.resourceId).get();
                }).then(function(response) {
                  phraseManager.registerPhrase(response.data);
                  //ch.ack(msg);
                })
                .catch(function(err) {
                  logger.error('WORKER error: ', err);
                  connection.regenerateDriver();
                  throw new ComposerError('error:worker:phrase', 'Error registering phrase: ' + err, 422);
                  //ch.nack(err, false, false);
                });

              break;

          }

        }

      }
    }

    return conn.createChannel().then(function(ch) {
      process.once('SIGINT', function() {
        conn.close();
        process.exit();
      });

      var queue = 'composer-' + uuid.v4(),
        exchange = 'eventbus.exchange',
        pattern = '';

      var ok = ch.assertQueue(queue, {
        durable: false,
        autoDelete: true
      }).then(function() {

        return ch.bindQueue(queue, exchange, pattern);

      }).then(function() {

        ch.consume(queue, function(message) {
            //Added callback function in case we need to do manual ack of the messages
            doWork(ch, message);
          },
          Object.create({
            noAck: true
          }));

        logger.debug('Worker up');
        dfd.resolve();
      });

      return ok;

    }).catch(function(err) {

      logger.error('WORKER: error creating channel', err);
      dfd.reject(err);
      if (conn) {
        conn.close(function() {
          process.exit(1);
        });
      }

    });

  }).then(null, function(err) {
    logger.error('Worker error %s', err);
    setTimeout(worker, config('rabbitmq.reconntimeout'));
  });

  return dfd.promise;
};

module.exports = {
  init: worker
};
