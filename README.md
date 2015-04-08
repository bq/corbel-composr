# corbel composer

[![Build Status](https://api.travis-ci.org/bq/corbel-composer.png?branch=master)](http://travis-ci.org/bq/corbel-composer)
[![npm version](https://badge.fury.io/js/corbel-composer.svg)](http://badge.fury.io/js/corbel-composer)
[![Dependency status](https://david-dm.org/bq/corbel-composer/status.png)](https://david-dm.org/bq/corbel-composer#info=dependencies&view=table)
[![Dev Dependency Status](https://david-dm.org/bq/corbel-composer/dev-status.png)](https://david-dm.org/bq/corbel-composer#info=devDependencies&view=table)
[![Coverage Status](https://coveralls.io/repos/bq/corbel-composer/badge.svg?branch=master)](https://coveralls.io/r/bq/corbel-composer?branch=master)


A corbel composer is a middleware based in nodeJS with express, to offer developers to make his own specific application API.

## [Homepage](http://opensource.bq.com/corbel-js/)


## Overview

[text]

### Diagram

[image]


## Requisites

This project requires nodejs to run properly.

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

```
npm install -g node-inspector
```

```
npm run debug
```

