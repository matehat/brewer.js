var brewer = require('../..'),
    debug = require('../../lib/command').debug,
    fs = require('fs'),
    path = require('path'),
    sys = require('util'),
    assert = require('assert'),
    _ = require('underscore'),
    jsdom = require('jsdom'),
    cssom = require('cssom'),
    color = require('ansi-color').set,
    Project = brewer.Project,
    OK = require('..').OK,
    jspackage, jspackage2;

exports.tests = {
  setup: function() {
    process.chdir(path.resolve(__dirname));
    project = Project.fromBrewfile(path.resolve(__dirname, './Brewfile'))
    jspackage = project[0];
    jspackage2 = project[1];
  },
  clean: function() {
    project.clean();
  },
  'Packaging Coffeescript': function(next) {
    jspackage.ready(function() { jspackage.actualize(function() {
      test = require('./js/build/test');
      assert.ok(test.F == 2);
      OK('test.F == 2');
      assert.ok(test.A == 1);
      OK('test.A == 1');
      
      test = require('./js/build/test.min');
      assert.ok(test.F == 2);
      OK('test.F == 2')
      assert.ok(test.A == 1);
      OK('test.A == 1')
      next();
    }) });
  },
  'Packaging Coffeescript + External Libraries': function(next3) {
    jspackage2.ready(function() { 
      jspackage2.actualize(function(next) {
      jsdom.env({
        html: '<html><body></body></html>',
        src: [fs.readFileSync('./js/build/test2.js')],
        done: function(errors, window) {
          assert.ok(window.Backbone.VERSION == '0.9.0');
          OK('window.Backbone.VERSION == "0.9.0"');
          assert.ok(window.$('body').data('id') == 'hello');
          OK('window.$("body").data("id") == "hello"');
          next2();
        }
      });
      function next2() {
        jsdom.env({
          html: '<html><body></body></html>',
          src: [fs.readFileSync('./js/build/test2.min.js')],
          done: function(errors, window) {
            assert.ok(window.Backbone.VERSION == '0.9.0');
            OK('window.Backbone.VERSION == "0.9.0"');
            assert.ok(window.$('body').data('id') == 'hello');
            OK('window.$("body").data("id") == "hello"');
            next3();
          }
        });
      }
    }) 
    });
  },
};