```
                                                                             
   _|_|_|                                                  _|_|_|  _|_|_|    
 _|          _|_|    _|_|_|  _|_|    _|_|_|      _|_|    _|        _|    _|  
 _|        _|    _|  _|    _|    _|  _|    _|  _|    _|    _|_|    _|_|_|    
 _|        _|    _|  _|    _|    _|  _|    _|  _|    _|        _|  _|    _|  
   _|_|_|    _|_|    _|    _|    _|  _|_|_|      _|_|    _|_|_|    _|    _|  
                                     _|                                      
                                     _|                                      
```

[![Build Status](https://api.travis-ci.org/corbel-platform/corbel-composr.png?branch=master)](http://travis-ci.org/corbel-platform/corbel-composr)
[![npm version](https://badge.fury.io/js/corbel-composr.svg)](http://badge.fury.io/js/corbel-composr)
[![Dependency status](https://david-dm.org/corbel-platform/corbel-composr/status.png)](https://david-dm.org/corbel-platform/corbel-composr#info=dependencies&view=table)
[![Dev Dependency Status](https://david-dm.org/corbel-platform/corbel-composr/dev-status.png)](https://david-dm.org/corbel-platform/corbel-composr#info=devDependencies&view=table)
[![Coverage Status](https://coveralls.io/repos/corbel-platform/corbel-composr/badge.svg?branch=master)](https://coveralls.io/r/corbel-platform/corbel-composr?branch=master)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Code Climate](https://codeclimate.com/github/corbel-platform/corbel-composr/badges/gpa.svg)](https://codeclimate.com/github/corbel-platform/corbel-composr)
[![Test Coverage](https://codeclimate.com/github/corbel-platform/corbel-composr/badges/coverage.svg)](https://codeclimate.com/github/corbel-platform/corbel-composr/coverage)


[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)


## [Homepage](http://opensource.bq.com/composr/)

## Overview

CompoSR is a [nodeJS](https://nodejs.org/api/) middleware, built on top  of [restify](http://restify.com/), for [Corbel][corbel-link].

It uses the [composr-core](https://github.com/bq/composr-core) capabilities and offers developers the ability to make their own specific application API with a Corbel generic backend.

Composr is responsible for **composing** **phrases** of code than can be reused by multiple applications. Those phrases can use all the methods exposed by [corbel-js](https://github.com/bq/corbel-js) and some extra useful libraries.

> wiki: A composer (Latin com+ponere, literally "one who puts together") is a person who creates music.

>wiki: In music and music theory, phrase and phrasing are concepts and practices related to grouping consecutive melodic notes, both in their composition and performance. A musical work is typically made up of a melody that consists of numerous consecutive phrases.

## Features

- Built in PM2 configuration for cluster mode
- Bunyan Access logs
- Winston Logs (debug, info, warn, error)
- Endpoint documentation
- Plugable middlewares
- Dynamic versioning support
- RabbitMQ connection for endpoint updates
- Status and Healthcheck endpoints
- Keymetrics and Newrelic support
- Docker Ready!
- [Corbel][corbel-link] ready!


## QuickStart

- install

  ```
  npm install -g corbel-platform/corbel-composr
  ```

- run server

  ```
  corbel-composr
  ```

## Configuration

You can send the following environment variables (or define a environment config file under `src/config/[ENV].json`).

### Default config file

```
{
    "serverName" : "CompoSR",
    "bodylimit" : "50mb",
    "port": 3000,
    
    "rabbitmq.host": "RABBIT_HOST",
    "rabbitmq.port": "RABBIT_PORT",
    "rabbitmq.username": "RABBIT_USERNAME",
    "rabbitmq.password": "RABBIT_PASSWORD",
    "rabbitmq.reconntimeout": 10000,
    "rabbitmq.event": "class io.corbel.event.ResourceEvent",
    "rabbitmq.forceconnect": true,
    "rabbitmq.heartbgeat": 30,

    "bootstrap.retrytimeout": 10000,

    "phrases.timeout": 10000,

    "services.timeout": 5000,
    "services.retries": 30,
    "services.time": 1000,

    "corbel.composr.credentials": {
        "clientId": "CLIENT_ID",
        "clientSecret": "CLIENT_SECRET",
        "scopes": "composr:comp:base"
    },

    "corbel.driver.options": {
        "urlBase": "https://{{module}}corbel-domain.io/"
    },

    "bunyan.log" : true,
    "bunyan.syslog" : true,
    "bunyan.stdout": false,
    "bunyan.streamServer": false,

    "composrLog.accessLog" : true,
    "composrLog.accessLogFile" : "logs/access.log",
    "composrLog.logLevel": "error",
    "composrLog.logFile": "logs/composr.log",
    "composrLog.syslog" : false,

    "newrelic" : false,
    "newrelic.name": "",
    "newrelic.key": "",

    "keymetrics": true
}
```

Almost all of the vales in the configuration file can be overwriten by environment variables:

### Environment variables

```
SERVER_NAME (Composr 2.0)
PORT (3000)
CREDENTIALS_CLIENT_ID
CREDENTIALS_CLIENT_SECRET
CREDENTIALS_SCOPES
URL_BASE
ACCESS_LOG => winston access log
ACCESS_LOG_FILE => winston access log file
LOG_LEVEL => winston log level
LOG_FILE => winston log file
BUNYAN_LOG(true) => Bunyan logs
BUNYAN_SYSLOG(true) => Send bunyan stream to syslog (127.0.0.1:514)
BUNYAN_STDOUT(false) => Bunyan output in terminal
BUNYAN_STREAM_SERVER (null) => Composr Stream Server endpoint
RABBITMQ_HOST
RABBITMQ_PORT
RABBITMQ_USERNAME
RABBITMQ_PASSWORD
RABBITMQ_FORCE_CONNECT => Only launch composr if rabbit is connected
RABBITMQ_HEARTBEAT => Heartbeat for the rabbitmq connection
SERVICES_TIMEOUT
SERVIES_RETRIES
SERVICES_TIME 
KEYMETRICS (true) => Keymetrics active
NRACTIVE => New relic active
NRAPPNAME => New relic app name
NRAPIKEY => New relic api key
```

## Read:

[What are Phrases or Snippets?](https://github.com/corbel-platform/composr-core/wiki/Phrases)

## Routing endpoints

Corbel-CompoSR has a similar routing mechanism than restify. You can define urls by following this conventions:

- `:param` : Url parameter
- `user` : Fixed path value

Some examples

- `user/:userId`
- `user/status/:parameter`
- `thing/one`

```json
{
    "url": "paramsExample/:pathparam",
    "get": {
        "code": "res.status(200).send('path param: ' + req.params.pathparam + ',  query param: ' + req.query.queryparam);"
    },
    "post": {
       /*...*/
    },
    "put": {
       /*...*/
    }
}
```

### Reference

* [composr-core](https://github.com/corbel-platform/composr-core)
* [corbel-js](https://github.com/corbel-platform/corbel-js) API
* [RAML](http://raml.org/) for phrase definition


# Logs

**CompoSR** is shipped with built-in **bunyan** and **winston** support.

## Winston logs:

You can set `logFile` and `logLevel` in your config file.

Available log levels can be found at [winston's npm page](https://www.npmjs.com/package/winston#logging-levels):
- debug
- info
- warn
- error

## Bunyan Logs:

Bunyan logs are enabled by default. You can disable them by turning `bunyan.log` to `false` in your configuration.


## Tests

```
npm test
```


### Coverage

```
npm run coverage
```


### Debug

Requires [node-inspector](https://github.com/node-inspector/node-inspector)
```
npm install -g node-inspector
```

* Server

  ```
  npm run debug --myphrase.get
  ```

* Tests

  ```
  npm run test:debug
  ```



## API design best practices

### Naming

* Use nouns not verbs
* Use plural nouns

| Resource     | GET (read)             | POST (create)            | PUT (update)                | DELETE                    |
| ------------ | ---------------------- | ------------------------ | --------------------------- | ------------------------- |
| /cars        | Returns a list of cars | Create a new ticket      | Bulk update of cars         | Delete all cars           |
| /cars/711    | Returns a specific car | Method not allowed (405) | Updates a specific ticket   | Deletes a specific ticket |
| /purchase    | Get al purchases       | Create a new purchase    | Bulk update of purschases   | Delete all purchases      |
| /purchase/85 | Returns a purchase     | Method not allowed (405) | Updates a specific purchase | Delete all purchases      |


Resource  GET
read  POST
create  PUT
update  DELETE
/cars Returns a list of cars  Create a new ticket Bulk update of cars Delete all cars
/cars/711 Returns a specific car  Method not allowed (405)   Deletes a specific ticket

### Versioning your phrases

A simple way to achieve this is defining the phrase version in the url, like this

```
{
    "url": "v1/paramsExample/:pathparam",
    "get": { ... }
}
```

A phrase version should change only if the phrase contract is broken

### Phrase Middlewares

We offer a set of plugable add-ons that will automatically add functionality to your phrases. 
These middlewares or hooks are executed before or after the code on your phrase. 
You can specify them on the phrase's spec at a method level like this (order is important!):

```
{
  "url": "resource",
  "get": {
    "middlewares": [
      "auth"
      "validate", 
      "mock"
    ],
    "doc": {
...
}
```
  
Among the available middlewares you can find:
* 'corbel-auth-client': Automatic corbel authentication for clients
* 'corbel-auth-user': Automatic corbel authentication for users. A new attribute 'userId' will be available on the phrase for a succeeding user token.
* 'validate': Automatic validation of path params, query params and body based on documentations' schema
* 'mock': Mocked responses based on schema or example from documentation 

### Reference

* [APIgee](http://apigee.com/about/resources/ebooks/web-api-design)
* [Principios de diseño de APIs REST](https://leanpub.com/introduccion_apis_rest)
* [Best Practices for Designing a Pragmatic RESTful API](http://www.vinaysahni.com/best-practices-for-a-pragmatic-restful-api#versioning)
* [REST API Resoruces](http://www.restapitutorial.com/resources.html)

## Run in a docker container

- clone repo
- build image

  ```
  docker build -t <username>/corbel-composr .
  ```

- run container

  ```
  docker run -d -p 3000:3000 --name="corbel-composr"  <username>/corbel-composr
  ```
- start/stop container

  ```
  docker start/stop corbel-composr
  ```


## Postman Playground

1. Get [postman](https://www.getpostman.com/)
2. Import corbel-composr collection:

  ```
  https://raw.githubusercontent.com/corbel-platform/corbel-composr/master/doc/postman/postman.json
  ```
3. Import evironment example:

  ```
  https://raw.githubusercontent.com/corbel-platform/corbel-composr/master/doc/postman/environment.example.json
  ```
4. Import globals:

  ```
  https://raw.githubusercontent.com/corbel-platform/corbel-composr/master/doc/postman/globals.example.json
  ```
5. Enjoy!


[corbel-link]: https://github.com/bq/corbel
