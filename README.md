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
[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)



## [Homepage](http://opensource.bq.com/composr/)

## Overview

CompoSR is a [nodeJS](https://nodejs.org/api/) middleware, built on top  of [express](http://expressjs.com/4x/api.html), for [Corbel][corbel-link].

It uses the [composr-core](https://github.com/bq/composr-core) capabilities and offers developers the ability to make their own specific application API with a Corbel generic backend.

Composr is responsible for **composing** **phrases** of code than can be reused by multiple applications. Those phrases can use all the methods exposed by [corbel-js](https://github.com/bq/corbel-js) and some extra useful libraries.

> wiki: A composer (Latin com+ponere, literally "one who puts together") is a person who creates music.

>wiki: In music and music theory, phrase and phrasing are concepts and practices related to grouping consecutive melodic notes, both in their composition and performance. A musical work is typically made up of a melody that consists of numerous consecutive phrases.


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
SERVICES_TIMEOUT
SERVIES_RETRIES
SERVICES_TIME 
KEYMETRICS (true) => Keymetrics active
NRACTIVE => New relic active
NRAPPNAME => New relic app name
NRAPIKEY => New relic api key
```

## Phrases

Phrases are one of the CompoSR strongest capabilities, they are JSON models that can define a dinamic endpoint. 

Each Phrase has an endpoint and the list of HTTP verbs it can handle (POST, PUT, GET, DELETE) with their code associated.

See the following Phrase model.

```
{
    "url": "user/:userID",
    "get": {
        "code": "res.status(200).send({title: 'hello world', user: req.params.userID});",
        "doc": {
            "description": "Phrase description",
            "queryParameters": {
                "param1": {
                    "type": "number",
                    "description": "Param description",
                    "default": 0
                }
            },
            "responses": {
                "200": {
                    "body": {
                        "application/json": {
                            "schema": "{\n\t"$schema": "http://json-schema.org/schema",\n\t"type": "object",\n\t"description": "A canonical song",\n\t"properties": {\n\t\t"title": {\n\t\t\t"type": "String"\n\t\t},\n\t\t"artist": {\n\t\t\t"type": "String"\n\t\t}\n\t},\n\t"required": ["title", "artist"]\n}"
                        }
                    }
                }
            }
        }
    }
}
```

### Routing

Composr Phrases have a similar routing mechanism than expressJS. You can define optional and fixed parameters on the urls by following this conventions:

- `:param` : Mandatory parameter
- `:param?` : Optional parameter

Some examples

- `user/:userId`
- `user/status/:optionalParam?`
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

## Writting CompoSR phrases

On execution time all the phrases are wrapped inside this `Function` closure, meaning you can access any of it's params:

```
function phrase(req, res, next, corbelDriver, domain, require){
  //Your phrase code
}
```

- req, res, next : [express](https://www.npmjs.com/package/express) request parameters
- [corbel](https://www.npmjs.com/package/corbel-js): Corbel JavaScript SDK with an extended `corbel.generateDriver` function that generates `corbelDriver` instances with the correct `urlBase`.
- corbelDriver : An instance of corbelDriver provided by corbel, instantiated with your `Authorization` header if provided
- require : A package and snippet requirer

## Phrases examples:

### `count` value in collections query

```json
{
    "url": "countExample",
    "get": {
        "code": /*...*/
    }
}
```

where `code` should be a string with, this [corbel-js](https://github.com/bq/corbel-js) code snippet:

```javascript
//Example endpoint code
corbelDriver.resources.collection('test:ComposrTest').get(undefined, {
    aggregation: {
        $count: '*'
    }
}).then(function(response) {
    res.status(200).send(response.data.count);
.catch(function(error) {
    res.status(500).send(error);
});
```

### Login a client 

Phrase code : 

```javascript
var corbel = require('corbel-js');
var ComposrError = require('ComposrError');
var utils = require('composrUtils');

function validateParams(){
  return Promise.resolve()
    .then(function(){
      if (!req.body || !req.body.jwt) {
        throw new ComposrError('error:jwt:undefined', '', 401);
      }
    });
}

function loginClient(){
  var corbelDriver = corbel.generateDriver({
    iamToken: '',
    domain : domain
  });
  /*
   - Required claims:
   - iss: CLIENT_ID
   - aud: 'http://iam.bqws.io'
   - scope: 'scope1 scope2'
   - exp: epoch + 1h
   */
  return corbelDriver.iam.token().create({
    jwt: req.body.jwt
  });
}


validateParams()
  .then(loginClient)
  .then(function(response){
    res.status(200).send(response.data);
  })
  .catch(function(err){
    res.status(err.status).send(err);
  });
```

## How can I generate Phrase models ? 

> we are developing some cool tools that you will be able to use in order to avoid thinking about phrase models, and just worry about the code.

## Code snippets

Code snippets are a minor form of `phrases`, they are accesible through the `require` function on your phrases.

```javascript
var mySnippet = require('snippet-mySnippet');

//Do whatever you want with that snippet
```

Corbel `domains` can only access it's own snippets, the Snippet syntax is the following one:

```javascript
//Random thing
var myModel = function(options){
  this.options = options;
}

//Mandatory exports
exports(myModel);
```

Those snippets are also stored in Corbel as JSON models.

```json
{
  "id": "domain:myModelSnippet",
  "codehash": "BASE64CodeHash"
}
```

## Reference

* [corbel-js](https://github.com/bq/corbel-js) API
* [Request object](http://expressjs.com/4x/api.html#req)
* [Response object](http://expressjs.com/4x/api.html#res)
* [RAML](http://raml.org/) for phrase definition

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

A simple way to achieve this is definning the phrase version in the url, like this

```
{
    "url": "v1/paramsExample/:pathparam",
    "get": { ... }
}
```

A phrase version should change only if the phrase contract is broken


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


## Tests

```
npm test
```


## Coverage

```
grunt test:coverage
```


## Debug

Requires [node-inspector](https://github.com/node-inspector/node-inspector)
```
npm install -g node-inspector
```

* Server

  ```
  npm run debug
  ```

* Tests

  ```
  npm run test:debug
  ```


# Logs

Logs are written to the linux syslog and in the logs folder.

You can set `logFile` and `logLevel` in your config file.

Available log levels can be found at [winston's npm page](https://www.npmjs.com/package/winston#logging-levels):
- debug
- info
- warn
- error

You can disable syslog by setting `syslog` property to `false` in the config file.



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
