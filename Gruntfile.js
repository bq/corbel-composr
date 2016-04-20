'use strict'

var request = require('request')
var madge = require('madge')

module.exports = function (grunt) {
  // show elapsed time at the end
  require('time-grunt')(grunt)
  // load all grunt tasks
  require('load-grunt-tasks')(grunt)

  var reloadPort = 35729
  var files

  function jsdocTask () {
    var exec = require('child_process').exec

    var done = this.async()

    var jsdocCmd = './node_modules/jsdoc/jsdoc'

    var src = ' -r src'
    var dest = ' -d doc/jsdoc'
    var config = ' -c .jsdoc'
    var template = ' -t node_modules/jaguarjs-jsdoc'

    exec(jsdocCmd + src + dest + config + template, function (err, stdout, stderr) {
      console.log(stdout)
      console.log(stderr)
      done(err === null)
    })
  }

  grunt.registerTask('jsdoc', 'Generates JSDoc', jsdocTask)

  grunt.initConfig({
    pkg: grunt.file.readJSON('./package.json'),

    clean: {
      all: ['.tmp']
    },

    develop: {
      server: {
        file: 'bin/composr'
      }
    },

    standard: {
      lint: {
        src: [
          './{bin,src,test}/**/*.js',
          '*.js',
          'bin/composr'
        ]
      },
      format: {
        options: {
          format: true,
          lint: true
        },
        src: [
          './{bin,src,test}/**/*.js',
          '*.js',
          'bin/composr'
        ]
      }
    },

    watch: {
      options: {
        nospawn: true,
        livereload: reloadPort
      },
      server: {
        files: [
          'bin/composr',
          'src/**/*.js'
        ],
        tasks: ['develop', 'delayed-livereload']
      },
      'public': {
        files: [
          'public/**/*.js',
          'public/**/*.css',
          'public/**/*.html',
          'src/**/*.ejs'
        ],
        options: {
          livereload: reloadPort
        }
      },
      test: {
        files: ['test/**/*.js', 'src/lib/**/*.js'],
        tasks: ['mochaTest:unit']
      }
    },

    mochaTest: { // test for nodejs app with mocha
      tap: {
        options: {
          reporter: 'tap',
          captureFile: 'target/test_results.dirty.tap', // Optionally capture the reporter output to a file
          quiet: false // Optionally suppress output to standard out (defaults to false)
        },
        src: ['test/runner.js']
      },
      ci: {
        options: {
          reporter: 'spec'
        },
        src: ['test/runner.js']
      },
      unit: {
        options: {
          reporter: 'spec'
        },
        src: ['test/unit/test-suite.js']
      }
    },

    coveralls: {
      options: {
        force: false
      },
      'default': {
        src: 'coverage/lcov.info'
      }
    },

    release: {
      /* For more options: https://github.com/geddski/grunt-release#options */
      options: {
        indentation: '\t', // default: '  ' (two spaces)
        commitMessage: 'Release v<%= version %>', // default: 'release <%= version %>'
        tagMessage: 'v<%= version %>', // default: 'Version <%= version %>',
        tagName: 'v<%= version %>'
      }
    },

    todo: {
      options: {},
      src: [
        'test/**/**', 'src/**/**'
      ]
    }

  })

  grunt.config.requires('watch.server.files')
  files = grunt.config('watch.server.files')
  files = grunt.file.expand(files)

  // Register circular dependencies
  grunt.registerTask('madge', 'Run madge.', function () {
    var dependencyObject = madge('./src')
    var listOfCircularDependencies = dependencyObject.circular().getArray()

    if (listOfCircularDependencies.length > 0) {
      grunt.log.error('CIRCULAR DEPENDENCIES FOUND')
      grunt.log.error(listOfCircularDependencies)
      return false
    } else {
      grunt.log.writeln('No circular dependencies found :)')
    }
  })

  grunt.registerTask('delayed-livereload', 'Live reload after the node server has restarted.', function () {
    var done = this.async()
    setTimeout(function () {
      request.get('http://localhost:' + reloadPort + '/changed?files=' + files.join(','), function (err, res) {
        var reloaded = !err && res.statusCode === 200
        if (reloaded) {
          grunt.log.ok('Delayed live reload successful.')
        } else {
          grunt.log.error('Unable to make a delayed live reload.')
        }
        done(reloaded)
      })
    }, 500)
  })

  grunt.registerTask('default', [
    'clean',
    'standard:lint',
    'test',
    'develop',
    'watch'
  ])

  grunt.registerTask('test', [
    'standard:format',
    'madge',
    'mochaTest:unit',
    'mochaTest:ci',
    'todo'
  ])

  grunt.registerTask('unit', [
    'mochaTest:unit'
  ])

  grunt.registerTask('integration', [
    'mochaTest:ci'
  ])
}
