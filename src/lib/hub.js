'use strict'

const util = require('util')
const EventEmitter = require('events')

function Hub () {
  EventEmitter.call(this)
}

util.inherits(Hub, EventEmitter)

module.exports = exports = new Hub()
