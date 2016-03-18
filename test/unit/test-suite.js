'use strict'

// lib
require('./specs/lib/rabbitMQworker.test.js')

// routes
require('./specs/routes/phrase.test.js')
require('./specs/routes/phrase.errorTest.js')
require('./specs/routes/snippet.test.js')
require('./specs/routes/snippet.errorTest.js')

// other
require('./specs/ComposrError.spec.js')
require('./specs/serviceChecking.spec.js')
require('./specs/hooks/mockHook.spec.js')
