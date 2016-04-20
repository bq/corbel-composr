'use strict'

var serverPromise = require('../bin/composr')

// Integration
require('./integration/test-suite.js')(serverPromise)
