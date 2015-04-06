'use strict';

var phraseManager = require('./phraseManager'),
    connection = require('./corbelConnection'),
    express = require('express'),
    router = express.Router(),
    amqp = require('amqplib'),
    uuid = require('uuid'),
    config = require('../config/config.json');

var worker = function() {
    // http://172.16.30.227:15672/#/
    var connUrl = 'amqp://' + config['rabbitmq.username'] + ':' + config['rabbitmq.password'] + '@' + config['rabbitmq.host'] + ':' + config['rabbitmq.port'];

    amqp.connect(connUrl).then(function(conn) {

        function doWork(msg) {
            if (msg.fields.routingKey === 'class com.bqreaders.silkroad.event.ResourceEvent') {
                var message = msg.content.toString();
                message = JSON.parse(message);

                if (message.type === connection.PHRASES_COLLECTION) {
                    switch (message.action) {
                        case 'DELETE':
                            var url = message.resourceId.replace(':', '/');
                            phraseManager.unregisterPhrase(router, url);
                            break;
                        default: // 'CREATE' or 'UPDATE'
                            connection.driver.then(function(driver) {
                                return driver.resources.resource(connection.PHRASES_COLLECTION, message.resourceId).get().then(function(response) {
                                    phraseManager.registerPhrase(router, response.data);
                                });
                            });
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
                durable: true,
                autoDelete: true
            });

            ok = ok.then(function() {
                ch.bindQueue(queue, exchange, pattern);
            });

            ok = ok.then(function() {
                ch.consume(queue, doWork, {
                    noAck: true
                });
                console.log('Worker up');
            });

            return ok;
        });
    }).then(null, function(err) {
        console.error('Error %s', err);
        setTimeout(worker, config['rabbitmq.reconntimeout']);
    });
};

worker();

module.exports = router;
