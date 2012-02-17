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
    project = new Project(path.resolve(__dirname, './Brewfile'));
    project.clean();
    jspackage = project[0];
    jspackage2 = project[1];
  },
  clean: function() {
    project.clean();
  },
  'Requirements': function(next) {
    assert.ok(project.requiredModules().length == 3);
    OK('The project has 2 requirements');
    assert.ok(project.missingModules().length == 0);
    OK('The project doesn\'t have missing required modules');
    next()
  },
  'Packaging Coffeescript': function(next) {
    jspackage.actualize(function() {
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
    });
  },
  'Packaging Coffeescript + External Libraries': function(next3) {
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
    });
  },
  'Packaging IcedCoffeescript': function(next) {
      jsdom.env({
        html: '<html><body></body></html>',
        src: [fs.readFileSync('./js/iced/testics.js')],
        done: function(errors, window) {
          window.tester(function(msg) {
            assert.ok(msg == 'Hello!');
            OK("ICS control flow correct!");
            next()
          });
        }
      });
  }
};