'use strict';

// Unit
// TODO: rewrite all unit tests
require('./unit/test-suite.js');

var app = require('../bin/composer');

// Integration
// TODO: rewrite all integration tests
require('./integration/test-suite.js')(app);
