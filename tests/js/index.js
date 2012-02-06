var brewer = require('../..'),
    fs = require('fs'),
    path = require('path'),
    sys = require('util'),
    assert = require('assert'),
    _ = require('underscore'),
    jsdom = require('jsdom'),
    cssom = require('cssom'),
    color = require('ansi-color').set,
    Package = brewer.Package,
    OK = require('..').OK;

exports.tests = {
  setup: function() {
    process.chdir(path.resolve(__dirname));
    var configs = JSON.parse(fs.readFileSync(path.resolve(__dirname, './brewer.json')), 'utf-8');
    jspackage = Package.create(configs[0]);
    jspackage2 = Package.create(configs[1]);
  },
  'Packaging Coffeescript': function(cb) {
    jspackage.bundleAll(function() {
      test = require('./js/build/test');
      assert.ok(test.F == 2);
      OK('test.F == 2');
      assert.ok(test.A == 1);
      OK('test.A == 1');
      cb();
    });
  },
  'Compressing Coffeescript': function(cb) {
    jspackage.compressAll(function() {
      test = require('./js/build/test.min');
      assert.ok(test.F == 2);
      OK('test.F == 2')
      assert.ok(test.A == 1);
      OK('test.A == 1')
      cb();
    });
  },
  'Packaging Coffeescript + External Libraries': function(next) {
    jspackage2.bundleAll(function() {
      jsdom.env({
        html: '<html><body></body></html>',
        src: [fs.readFileSync('./js/build/test2.js')],
        done: function(errors, window) {
          assert.ok(window.Backbone.VERSION == '0.9.0');
          OK('window.Backbone.VERSION == "0.9.0"');
          assert.ok(window.$('body').data('id') == 'hello');
          OK('window.$("body").data("id") == "hello"');
          next();
        }
      });
    });
  },
  'Compressing Coffeescript + External Libraries': function(next) {
    jspackage2.compressAll(function() {
      jsdom.env({
        html: '<html><body></body></html>',
        src: [fs.readFileSync('./js/build/test2.min.js')],
        done: function(errors, window) {
          assert.ok(window.Backbone.VERSION == '0.9.0');
          OK('window.Backbone.VERSION == "0.9.0"');
          assert.ok(window.$('body').data('id') == 'hello');
          OK('window.$("body").data("id") == "hello"');
          next();
        }
      });
    });
  }
};