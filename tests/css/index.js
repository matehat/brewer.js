var brewer = require('../..'),
    fs = require('fs'),
    path = require('path'),
    sys = require('util'),
    assert = require('assert'),
    _ = require('underscore'),
    cssom = require('cssom'),
    color = require('ansi-color').set,
    Package = brewer.Package,
    OK = require('..').OK,
    
    select = function(css, sel) { return _.find(css, function(item, key) {return item.selectorText == sel}); };

exports.tests = {
  setup: function() {
    process.chdir(path.resolve(__dirname));
    packages = brewer.brewfile(path.resolve(__dirname, './Brewfile'));
    csspackage = packages[0];
    stylpackage = packages[1];
  },
  'Packaging LESS stylesheets': function(next) {
    csspackage.bundleAll(function() {
      css = cssom.parse(fs.readFileSync('./css/build-less/testless1.css', 'utf-8')).cssRules;
      bodyp = select(css,'body p');
      assert.ok(bodyp !== undefined && bodyp.style.color == 'white');
      OK("body p -> color: white");
      
      bodydiv = select(css,'body div');
      assert.ok(bodydiv !== undefined && bodydiv.style.color == 'black');
      OK("body div -> color: black");
      
      data = select(css,'#data');
      assert.ok(data !== undefined && data.style.float == 'left' && data.style['margin-left'] == '10px');
      OK("#data -> float: left; margin-left: 10px;");
      
      border = select(css,".border");
      assert.ok(border !== undefined && border.style.margin == '8px' && border.style['border-color'] == '#3bbfce');
      OK("#data -> margin: 8px; border-color: #3bbfce;");
      
      next();
    });
  },
  'Compressing LESS stylesheets': function(next) {
    csspackage.compressAll(function() {
      css = cssom.parse(fs.readFileSync('./css/build-less/testless1.min.css', 'utf-8')).cssRules;
      bodyp = select(css,'body p');
      assert.ok(bodyp !== undefined && bodyp.style.color == 'white');
      OK("body p -> color: white");
      
      bodydiv = select(css,'body div');
      assert.ok(bodydiv !== undefined && bodydiv.style.color == 'black');
      OK("body div -> color: black");
      
      data = select(css,'#data');
      assert.ok(data !== undefined && data.style.float == 'left' && data.style['margin-left'] == '10px');
      OK("#data -> float: left; margin-left: 10px;");
      
      border = select(css,".border");
      assert.ok(border !== undefined && border.style.margin == '8px' && border.style['border-color'] == '#3bbfce');
      OK("#data -> margin: 8px; border-color: #3bbfce;");
      
      next();
    });
  },
  'Packaging Stylus stylesheets': function(next) {
    stylpackage.bundleAll(function() {
      css = cssom.parse(fs.readFileSync('./css/build-stylus/test1.css', 'utf-8')).cssRules;
      
      bodylogo = select(css, "body #logo");
      assert.ok(bodylogo !== undefined && bodylogo.style["-webkit-border-radius"] == '5px');
      OK("body #logo -> -webkit-border-radius: 5px;");
      
      bodycont = select(css, "body .container");
      assert.ok(bodycont !== undefined && bodycont.style.margin == '0 auto');
      OK("body .container -> margin: 0 auto;");
      
      css = cssom.parse(fs.readFileSync('./css/build-stylus/test2.css', 'utf-8')).cssRules;
      body = select(css, "body");
      assert.ok(body !== undefined && body.style.position == 'fixed');
      assert.ok(body !== undefined && body.style.right == '0');
      OK("body -> position: fixed; right: 0;");
      next();
    });
  },
  'Compressing Stylus stylesheets': function(next) {
    stylpackage.compressAll(function() {
      css = cssom.parse(fs.readFileSync('./css/build-stylus/test1.min.css', 'utf-8')).cssRules;
      
      bodylogo = select(css, "body #logo");
      assert.ok(bodylogo !== undefined && bodylogo.style["-webkit-border-radius"] == '5px');
      OK("body #logo -> -webkit-border-radius: 5px;");
      
      bodycont = select(css, "body .container");
      assert.ok(bodycont !== undefined && bodycont.style.margin == '0 auto');
      OK("body .container -> margin: 0 auto;");
      
      css = cssom.parse(fs.readFileSync('./css/build-stylus/test2.min.css', 'utf-8')).cssRules;
      body = select(css, "body");
      assert.ok(body !== undefined && body.style.position == 'fixed');
      assert.ok(body !== undefined && body.style.right == '0');
      OK("body -> position: fixed; right: 0;");
      next();
    });
  }
};