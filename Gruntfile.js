'use strict';

var request = require('request');

module.exports = function(grunt) {
    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    var reloadPort = 35729,
        files;

    grunt.initConfig({
        pkg: grunt.file.readJSON('./package.json'),
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
            }
        },
        mochaTest: { //test for nodejs app with mocha
            tap: {
                options: {
                    reporter: 'tap',
                    captureFile: 'target/test_results.dirty.tap', // Optionally capture the reporter output to a file
                    quiet: false // Optionally suppress output to standard out (defaults to false)
                },
                src: ['test/test-suite.js']
            },
            ci: {
                src: ['test/test-suite.js']
            }
        }
    });

    grunt.config.requires('watch.server.files');
    files = grunt.config('watch.server.files');
    files = grunt.file.expand(files);

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
        'jshint',
        'test',
        'develop',
        'watch'
    ]);

    grunt.registerTask('test', [
        'jshint',
        'mochaTest:ci'
    ]);
};
