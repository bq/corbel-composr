# corbel composer

[![Build Status](https://api.travis-ci.org/bq/corbel-composer.png?branch=master)](http://travis-ci.org/bq/corbel-composer)
[![npm version](https://badge.fury.io/js/corbel-composer.svg)](http://badge.fury.io/js/corbel-composer)
[![Dependency status](https://david-dm.org/bq/corbel-composer/status.png)](https://david-dm.org/bq/corbel-composer#info=dependencies&view=table)
[![Dev Dependency Status](https://david-dm.org/bq/corbel-composer/dev-status.png)](https://david-dm.org/bq/corbel-composer#info=devDependencies&view=table)
[![Coverage Status](https://coveralls.io/repos/bq/corbel-composer/badge.svg?branch=master)](https://coveralls.io/r/bq/corbel-composer?branch=master)

A corbel-composer is a middleware based in [nodeJS](https://nodejs.org/api/) with [express](http://expressjs.com/4x/api.html), to offer developers to make his own specific application API bsed in [corbel-js](https://github.com/bq/corbel-js)

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


## Phrase Model

```
{
    "url": "phraseName",
    "get": {
        "code": "res.render('index', {title: 'hello world'});",
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

# Example code for phrases

## Login a client

```javascript
corbelDriver.iam.token().create().then(function(response) {
  res.send(response);
})
.catch(function(err){
  res.status(500).send(err);
});
```

## Login a user

```javascript
//Extract the clientId from the auth token
var jwtDecoded = corbel.jwt.decode(req.get('Authorization'));
var clientId = jwtDecoded.clientId;

//Claims object for log the user in
var claims = {
  'iss' : clientId,
  'scopes' : req.body.scopes,
  'basic_auth.username' : req.body.username,
  'basic_auth.password' : req.body.password
};

var tokenObject;

//Request a session token for the user
corbelDriver.iam.token().create({
    claims : claims
  })
  .then(function(response){

    //Tenemos el token de usuario, asimismo tambien el refresh y el expires
    tokenObject = response.data;

    //Recreamos el corbelDriver con los settings del usuario
    var corbelDriver = corbel.generateDriver({
      iamToken : tokenObject
    });

    //Obtain the logged user data
    return corbelDriver.iam.user('me').get();
  })
  .then(function(response){
    res.send({
      tokenObject: tokenObject,
      user: response.data
    });
  })
  .catch(function(err){
    console.log('error', err);
    res.status(500).send(err);
  });
```

## Return current user info

```javascript
corbelDriver.iam.user('me').get();
```

# Code snippets

Code snippets are a minor form of `phrases`, they are accesible through the `compoSR` object on your phrases.

You can run your code snippets by executing `compoSR.run('snippetName', params);` where `params` is anything you want it to be. From your snippets you will be allowed to access to the `params` variable and the `compoSR` object itself.

`compoSR` will be allowed to access any snippets defined in your domain and your parent domains.

For example, `_silkroad:composer` will be able to access all the `_silkroad:composer` snippets and all the `_silkroad` snippets. If a snippet has the same name on both of the domains, the one with a deepest hierarchy will overwrite the first one.

Let's take a look at it:
  - Given this snippets:

```javascript
var snippets = {
  'domainName' : [
    {
      name : 'myFunction',
      code : 'compoSR.run("hello", "world")'
    },
    {
      name : 'hello',
      code: 'console.log(params);'
    }
  ],
  'domainName:childDomain' : [
    {
      name : 'hello',
      code: 'console.log("I am the child: ", params);'
    }
  ],
}
```

  - If we run the `myFunction` snippet, accesing from a client that belongs to the domain named `domainName:childDomain` it will show this:

```javascript
compoSR.run('myFunction');
//=> I am the child: world
```

  - If the client or user belongs to the domain named `domainName` and we execute the same function we'll get:

```javascript
compoSR.run('myFunction');
//=> hello world
```
