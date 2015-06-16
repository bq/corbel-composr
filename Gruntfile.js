'use strict';

var request = require('request');
var madge = require('madge');

module.exports = function(grunt) {
    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    var reloadPort = 35729,
        files;

    grunt.initConfig({

        pkg: grunt.file.readJSON('./package.json'),

        clean: {
            all: ['.tmp']
        },

        copy: {
            coverage: {
                expand: true,
                src: [
                    'test/**',
                    'src/**',
                    'bin/**',
                    // express files
                    'public/**',
                    'package.json'
                ],
                dest: '.tmp/coverage/'
            }
        },

        blanket: {
            coverage: {
                src: ['.tmp/coverage/src/'],
                dest: '.tmp/coverage/src/'
            }
        },

        develop: {
            server: {
                file: 'bin/composer'
            }
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'src/**/*.js'
            ]
        },

        watch: {
            options: {
                nospawn: true,
                livereload: reloadPort
            },
            server: {
                files: [
                    'bin/composer',
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
            test : {
              files: ['test/**/*.js', 'src/lib/**/*.js'],
              tasks: ['mochaTest:unit']
            }
        },

        mochaTest: { //test for nodejs app with mocha
            testCoverage: {
                options: {
                    reporter: 'spec',
                },
                src: ['.tmp/coverage/test/runner.js']
            },
            coverage: {
                options: {
                    reporter: 'html-cov',
                    quiet: true,
                    captureFile: '.tmp/coverage/coverage.html'
                },
                src: ['.tmp/coverage/test/runner.js']
            },
            coveralls: {
                options: {
                    reporter: 'mocha-lcov-reporter',
                    quiet: true,
                    captureFile: '.tmp/coverage/lcov.info'
                },
                src: ['.tmp/coverage/test/runner.js']
            },
            'travis-cov': {
                options: {
                    reporter: 'travis-cov'
                },
                src: ['.tmp/coverage/test/runner.js']
            },
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

        express: {
            composer: {
                options: {
                    script: 'bin/composer',
                    logs: {
                        out: 'composer.out.log',
                        err: 'composer.err.log'
                    }
                }
            },
            /*coverage: {
                options: {
                    script: 'bin/composer.coverage',
                    logs: {
                        out: 'composer.out.log',
                        err: 'composer.err.log'
                    }
                }
            }*/
        },

        coveralls: {
            options: {
                force: false
            },
            'default': {
                src: '.tmp/coverage/lcov.info'
            }
        },

        release: {
            /* For more options: https://github.com/geddski/grunt-release#options */
            options: {
                indentation: '\t', //default: '  ' (two spaces)
                commitMessage: 'Release v<%= version %>', //default: 'release <%= version %>'
                tagMessage: 'v<%= version %>', //default: 'Version <%= version %>',
                tagName: 'v<%= version %>'
            }
        }

    });

    grunt.config.requires('watch.server.files');
    files = grunt.config('watch.server.files');
    files = grunt.file.expand(files);

    //Register circular dependencies
    grunt.registerTask('madge', 'Run madge.', function() {
      var dependencyObject = madge('./src');
      var listOfCircularDependencies = dependencyObject.circular().getArray();

      if(listOfCircularDependencies.length > 0){
        grunt.log.error('CIRCULAR DEPENDENCIES FOUND');
        grunt.log.error(listOfCircularDependencies);
        return false;
      }else{
        grunt.log.writeln('No circular dependencies found :)');
      }
    });


    grunt.registerTask('delayed-livereload', 'Live reload after the node server has restarted.', function() {
        var done = this.async();
        setTimeout(function() {
            request.get('http://localhost:' + reloadPort + '/changed?files=' + files.join(','), function(err, res) {
                var reloaded = !err && res.statusCode === 200;
                if (reloaded) {
                    grunt.log.ok('Delayed live reload successful.');
                } else {
                    grunt.log.error('Unable to make a delayed live reload.');
                }
                done(reloaded);
            });
        }, 500);
    });

    grunt.registerTask('default', [
        'clean',
        'jshint',
        'test',
        'develop',
        'watch'
    ]);

    grunt.registerTask('test:coverage', [
        'clean',
        'jshint',
        'madge',
        'copy:coverage',
        'blanket',
        'mochaTest:testCoverage',
        'mochaTest:coverage',
        'mochaTest:coveralls',
        'mochaTest:travis-cov',
        'coveralls'
    ]);

    grunt.registerTask('test', [
        'jshint',
        'madge',
        'mochaTest:ci'
    ]);

    grunt.registerTask('unit', [
        'mochaTest:unit'
    ]);
};
