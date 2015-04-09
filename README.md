# corbel composer

[![Build Status](https://api.travis-ci.org/bq/corbel-composer.png?branch=master)](http://travis-ci.org/bq/corbel-composer)
[![npm version](https://badge.fury.io/js/corbel-composer.svg)](http://badge.fury.io/js/corbel-composer)
[![Dependency status](https://david-dm.org/bq/corbel-composer/status.png)](https://david-dm.org/bq/corbel-composer#info=dependencies&view=table)
[![Dev Dependency Status](https://david-dm.org/bq/corbel-composer/dev-status.png)](https://david-dm.org/bq/corbel-composer#info=devDependencies&view=table)
[![Coverage Status](https://coveralls.io/repos/bq/corbel-composer/badge.svg?branch=master)](https://coveralls.io/r/bq/corbel-composer?branch=master)

A corbel-composer is a middleware based in nodeJS with express, to offer developers to make his own specific application API bsed in [corbel-js](https://github.com/bq/corbel-js)

## [Homepage](http://opensource.bq.com/corbel-js/)


## Overview

[text]

### Diagram

[image]


## QuickStart

- install

  ```
  npm install -g bq/corbel-composer
  ```

- run server
  
  ```
  corbel-composer
  ```


## Postman Playground

1. Get [postman](https://www.getpostman.com/)
2. Import corbel-composer collection:

  ```
  https://raw.githubusercontent.com/bq/corbel-composer/master/doc/postman.json
  ```
3. Enjoy!


## Example Phrases

### `count` value in collections query

```json
{
    "url": "countExample",
    "get": {
        "code": "CORBEL-JS_SNIPPET"
    }
}
```

where `code` should be a string with this [corbel-js](https://github.com/bq/corbel-js) snippet:

```javascript
var count;
corbelDriver.resources.collection('test:ComposrTest').get(undefined, {
    aggregation: {
        $count: '*'
    }
}).then(function(response) {
    count = response.data.count;
    return corbelDriver.resources.collection('test:ComposrTest').get();
}).then(function(response) {
    res.send({
        data: response.data,
        'count': count
    });
}).catch(function(error) {
    res.send(error);
});
```

### Path & query parameters

```json
{
    "url": "paramsExample/:pathparam",
    "get": {
        "code": "res.status(200).send('path param: ' + req.params.pathparam + ',  query param: ' + req.query.queryparam);"
    }
}
```

## Reference

* [corbel-js](https://github.com/bq/corbel-js) API
* [Request object](http://expressjs.com/4x/api.html#req)
* [Response object](http://expressjs.com/4x/api.html#res)
* [RAML](http://raml.org/) for phrase definition

## Run in a docker container

- clone repo
- build image

  ```
  docker build -t <username>/corbel-composer .
  ```

- run container

  ```
  docker run -d -p 3000:3000 --name="corbel-composer"  <username>/corbel-composer
  ```
- start/stop container

  ```
  docker start/stop corbel-composer
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
