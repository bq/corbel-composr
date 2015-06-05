'use strict';

// Unit
require('./unit/test-suite.js');

var app = require('../bin/composer');

// Integration
require('./integration/test-suite.js')(app);
