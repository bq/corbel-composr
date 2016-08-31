'use strict'
var hub = require('../lib/hub')
var connection = require('../lib/connectors/corbel')
var ComposrError = require('composr-core').ComposrError
var logger = require('../utils/composrLogger')
var auth = require('../lib/auth')

/* ************************************
  Base Resource Endpoint, serves as pattern for the Phrases, Snippets and VirtualDomains API endpoints
*************************************/
function ResourceEndpoint (options) {
  this.itemName = options.itemName
  this.collection = options.collection
  this.manager = options.manager
}

ResourceEndpoint.prototype.upsert = function (req, res) {
  var that = this
  var authorization = this.getAuthorization(req)
  var item = req.body || {}
  var driver = this.getDriver(authorization)
  var domain = this.getDomain(authorization)

  logger.debug('[Resource]', 'Request upsert:', this.itemName, authorization, item)

  this.checkPublishAvailability(driver)
    .then(function () {
      return that.validate(item)
    })
    .then(function () {
      return that.upsertCall(domain, item)
    })
    .then(function (itemSaved) {
      that.emitEvent(that.itemName + ':upsert', domain, itemSaved.id)
      res.setHeader('Location', that.itemName + '/' + itemSaved.id)
      logger.info(that.itemName, 'created', itemSaved.id)
      res.send(200, itemSaved)
    })
    .catch(function (error) {
      logger.warn('[Resource]', 'Creating resource', 'invalid:client:' + that.itemName + ':upsert', domain, authorization)
      res.send(error.status, error)
    })
}

/**
 * Deletes a item
 * TODO: Implement the the delete mechanism using the core driver
 * but check if that phrase is from that client
 */
ResourceEndpoint.prototype.delete = function (req, res) {
  var that = this
  var authorization = this.getAuthorization(req)
  var driver = this.getDriver(authorization)
  var domain = this.getDomain(authorization)

  logger.debug('[Resource]', 'Request delete:', this.itemName, req.params.itemId)

  this.checkPublishAvailability(driver)
    .then(function () {
      var item = that.getItemById(req.params.itemId)
      if (item && item.getDomain() === domain) {
        return that.deleteCall(req.params.itemId)
          .then(function () {
            that.emitEvent(that.itemName + ':delete', domain, req.params.itemId)
            logger.info('[Resource]', 'item:deleted', req.params.itemId)
            res.send(204, 'deleted')
          })
          .catch(function (error) {
            res.send(error.status, new ComposrError('error:' + that.itemName + ':delete', error.message, error.status))
          })
      } else if (!item) {
        throw new Error('Trying to delete a ' + that.itemName + ' that does not exist')
      } else {
        throw new Error('Unauthorized client, trying to delete a ' + that.itemName + ' of another domain')
      }
    })
    .catch(function (error) {
      logger.warn('[Resource]', 'Deleting resource, invalid:client:' + that.itemName + ':delete', error)
      res.send(401, new ComposrError('error:delete:' + that.itemName + '', 'Unauthorized client', 401))
    })
}

/**
 * Returns a item by id
 */
ResourceEndpoint.prototype.get = function (req, res) {
  var authorization = this.getAuthorization(req)
  var domain = this.getDomain(authorization)

  if (!authorization || !domain) {
    res.send(401, new ComposrError('error:unauthorized', 'Invalid credentials', 401))
    return
  }

  logger.debug('[Resource]', 'Trying to get ' + this.itemName + ':', req.params.itemId)

  var item = this.getItemById(req.params.itemId)

  if (item) {
    res.send(200, item.getRawModel())
  } else {
    res.send(404, new ComposrError('error:' + this.itemName + ':not_found', 'The ' + this.itemName + ' you are requesting is missing', 404))
  }
}

/**
 * Returns all the domain items
 */
ResourceEndpoint.prototype.getAll = function (req, res) {
  var authorization = this.getAuthorization(req)
  var domain = this.getDomain(authorization)

  if (domain) {
    var items = this.getAllItems(domain)
    res.send(200, items || [])
  } else {
    res.send(401, new ComposrError('error:domain:undefined', '', 401))
  }
}

ResourceEndpoint.prototype.emitEvent = function (text, domain, id) {
  hub.emit(text, domain, id)
}

ResourceEndpoint.prototype.getAuthorization = function (req) {
  return auth.getAuth(req)
}

ResourceEndpoint.prototype.getDriver = function (authorization) {
  return connection.getTokenDriver(authorization)
}

ResourceEndpoint.prototype.getDomain = function (authorization) {
  return connection.extractDomain(authorization)
}

ResourceEndpoint.prototype.checkPublishAvailability = function (driver) {
  var that = this
  return driver.resources.collection(this.collection)
    .get()
    .catch(function () {
      throw new ComposrError('error:upsert:' + that.itemName, 'Unauthorized client', 401)
    })
}

ResourceEndpoint.prototype.getItemById = function (id) {
  return this.manager.getById(id)
}

ResourceEndpoint.prototype.getAllItems = function (domain) {
  return this.manager.getByDomain(domain)
}

ResourceEndpoint.prototype.validate = function (item) {
  var that = this
  return this.manager.validate(item)
    .catch(function (result) {
      var errors = result.errors
      logger.warn('[Resource]', 'validation, invalid:' + that.itemName, item, result)
      throw new ComposrError('error:' + that.itemName + ':validation', 'Error validating ' + that.itemName + ': ' +
        JSON.stringify(errors, null, 2), 422)
    })
}

ResourceEndpoint.prototype.upsertCall = function (domain, item) {
  var that = this
  return this.manager
    .save(domain, item)
    .catch(function (error) {
      logger.warn('[Resource]', 'invalid:upsert:' + that.itemName, error)
      throw error
    })
}

ResourceEndpoint.prototype.deleteCall = function (id) {
  var that = this
  return this.manager
    .delete(id)
    .catch(function (error) {
      logger.warn('[Resource]', 'invalid:delete:' + that.itemName, error)
      throw error
    })
}

module.exports = ResourceEndpoint
