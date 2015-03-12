'use strict';

var phraseManager = require('./phraseManager'),
    express = require('express'),
    router = express.Router(),
    amqp = require('amqplib'),
    uuid = require('uuid'),
    config = require('../config.json');

var worker = function() {
    var connUrl = 'amqp://' + config['rabbitmq.username'] + ':' + config['rabbitmq.password'] + '@' + config['rabbitmq.host'] + ':' + config['rabbitmq.port'];

    amqp.connect(connUrl).then(function(conn) {

        function doWork(msg) {
            if (msg.fields.routingKey === 'class com.bqreaders.silkroad.event.ResourceModifiedEvent') {
                var message = msg.content.toString();
                message = JSON.parse(message);

                if (message.type === process.env.PHRASES_COLLECTION) {
                    switch (message.action) {
                        case 'DELETE':
                            var url = message.resourceId.replace(':', '/');
                            phraseManager.unregisterPhrase(router, url);
                            break;
                        default: // 'CREATE' or 'UPDATE'
                            // @todo get phrase from sr
                            // @todo phraseManager.registerPhrase(router, phrase);
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
