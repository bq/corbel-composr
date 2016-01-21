'use strict'

/**
 * [extractDomainFromId description]
 * @param  {[type]} id [description]
 * @return {[type]}    [description]
 */
function extractDomainFromId (id) {
  return id.split('!')[0]
}

module.exports = {
  extractDomainFromId: extractDomainFromId
}
