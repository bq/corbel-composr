'use strict';

// Unit
// TODO: rewrite all unit tests
require('./unit/test-suite.js');

var serverPromise = require('../bin/composer');

// Integration
require('./integration/test-suite.js')(serverPromise);
