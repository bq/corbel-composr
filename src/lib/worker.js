'use strict';

var phraseManager = require('./phraseManager'),
    connection = require('./corbelConnection'),
    express = require('express'),
    router = express.Router(),
    amqp = require('amqplib'),
    uuid = require('uuid'),
    ComposerError = require('./composerError'),
    config = require('../config/config'),
    logger = require('../utils/logger');

var worker = function() {
    var connUrl = 'amqp://' + config['rabbitmq.username'] + ':' + config['rabbitmq.password'] + '@' + config['rabbitmq.host'] + ':' + config['rabbitmq.port'];

    amqp.connect(connUrl).then(function(conn) {

        function doWork(msg) {
            if (msg.fields.routingKey === 'class com.bqreaders.silkroad.event.ResourceEvent') {

                var message;
                try {
                    message = JSON.parse(msg.content.toString());
                } catch (error) {
                    throw new ComposerError('error:worker:message', 'Error parsing message: ' + error, 422);
                }

                if (message.type === connection.PHRASES_COLLECTION) {

                    switch (message.action) {
                        case 'DELETE':

                            phraseManager.unregisterPhrase(router, {
                                id: message.resourceId
                            });
                            break;

                        default: // 'CREATE' or 'UPDATE'

                            connection.driver.then(function(driver) {
                                return driver.resources.resource(connection.PHRASES_COLLECTION, message.resourceId).get();
                            }).then(function(response) {
                                phraseManager.registerPhrase(router, response.data);
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
            });

            ok = ok.then(function() {
                ch.bindQueue(queue, exchange, pattern);
            });

            ok = ok.then(function() {
                ch.consume(queue, doWork, {
                    noAck: true
                });
                logger.debug('Worker up');
            });

            return ok;
        });
    }).then(null, function(err) {
        logger.error('Worker error %s', err);
        setTimeout(worker, config['rabbitmq.reconntimeout']);
    });
};



module.exports = {
  router : router,
  init : function(){
    worker();
  }
};
