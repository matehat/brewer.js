(function() {
  var CoffeescriptSource, JavascriptBundle, Source, fs, path, util, _,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  fs = require('fs');

  path = require('path');

  util = require('./../util');

  Source = require('./../source').Source;

  JavascriptBundle = require('./javascript').JavascriptBundle;

  this.CoffeescriptSource = CoffeescriptSource = (function(_super) {

    __extends(CoffeescriptSource, _super);

    CoffeescriptSource.types = ['coffee-script', 'coffeescript', 'cs'];

    CoffeescriptSource.Bundle = JavascriptBundle;

    function CoffeescriptSource(options) {
      if (options.output == null) {
        throw "Coffeescript source needs a 'output' options";
      }
      _.defaults(options, {
        follow: true
      });
      this.follow = options.follow, this.output = options.output;
      this.ext = '.coffee';
      this.js_path = this.output;
      this.headerRE = /^#\s*require\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/;
      CoffeescriptSource.__super__.constructor.call(this, options);
    }

    CoffeescriptSource.prototype.test = function(path) {
      return util.hasExtension(path, '.coffee');
    };

    CoffeescriptSource.prototype.compileFile = function(cfpath, next) {
      var coffee,
        _this = this;
      coffee = require('coffee-script');
      return fs.readFile(cfpath, 'utf-8', function(err, cf) {
        var jspath;
        jspath = cfpath.replace(path.resolve(_this.path), path.resolve(_this.output));
        jspath = util.changeExtension(jspath, '.js');
        util.makedirs(path.dirname(jspath));
        return fs.writeFile(jspath, coffee.compile(cf), 'utf-8', function(err) {
          if (err) throw err;
          console.log("Compiled " + (cfpath.replace(_this.path, '')) + " -> " + (jspath.replace(_this.output, '')));
          return next();
        });
      });
    };

    return CoffeescriptSource;

  })(Source);

  Source.extend(CoffeescriptSource);

}).call(this);
