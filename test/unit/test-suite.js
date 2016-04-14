'use strict'

// lib
require('./specs/lib/rabbitMQworker.test.js')
require('./specs/lib/engine.test.js')

// routes
require('./specs/routes/phrase.test.js')
require('./specs/routes/phrase.errorTest.js')

// other
require('./specs/ComposrError.spec.js')
require('./specs/serviceChecking.spec.js')
require('./specs/hooks/mockHook.spec.js')
require('./specs/hooks/validateHook.spec.js')
