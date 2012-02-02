var brewer = require('../..'),
    fs = require('fs'),
    path = require('path'),
    sys = require('util'),
    assert = require('assert'),
    _ = require('underscore'),
    jsdom = require('jsdom'),
    color = require('ansi-color').set,
    Brewer = brewer.Brewer;

var OK = function(msg) { console.log(color("OK:", "green"), msg); };

exports.tests = {
  setup: function() {
    process.chdir(path.resolve(__dirname));
    var configs = JSON.parse(fs.readFileSync(path.resolve(__dirname, './brewer.json')), 'utf-8');
    jsbrewer = Brewer.create(configs[0]);
    jsbrewer2 = Brewer.create(configs[1]);
    cssbrewer = Brewer.create(configs[2]);
  },
  'Packaging Coffeescript': function(cb) {
    jsbrewer.packageAll(function() {
      test = require('./js/build/test');
      assert.ok(test.F == 2);
      OK('test.F == 2');
      assert.ok(test.A == 1);
      OK('test.A == 1');
      cb();
    });
  },
  'Compressing Coffeescript': function(cb) {
    jsbrewer.compressAll(function() {
      test = require('./js/build/test.min');
      assert.ok(test.F == 2);
      OK('test.F == 2')
      assert.ok(test.A == 1);
      OK('test.A == 1')
      cb();
    });
  },
  'Packaging Coffeescript + External Libraries': function(next) {
    jsbrewer2.packageAll(function() {
      jsdom.env({
        html: '<html><body></body></html>',
        src: [fs.readFileSync('./js/build/test2.js')],
        done: function(errors, window) {
          assert.ok(window.$('body').data('id') == 'hello');
          OK('window.$("body").data("id") == "hello"');
          next();
        }
      });
    });
  },
  'Compressing Coffeescript + External Libraries': function(next) {
    jsbrewer2.compressAll(function() {
      jsdom.env({
        html: '<html><body></body></html>',
        src: [fs.readFileSync('./js/build/test2.min.js')],
        done: function(errors, window) {
          assert.ok(window.$('body').data('id') == 'hello');
          OK('window.$("body").data("id") == "hello"');
          next();
        }
      });
    });
  },
  
  'Compressing SASS stylesheets': function(next) {
/*    cssbrewer.packageAll(function() {
      
    });*/
    next()
  },
};