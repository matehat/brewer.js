(function() {
  var CoffeescriptSource, File, JavascriptFile, Source, finished, fs, path, util, _,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  fs = require('fs');

  path = require('path');

  util = require('../util');

  Source = require('../source').Source;

  File = require('../file').File;

  finished = require('../command').finished;

  JavascriptFile = require('./javascript').JavascriptFile;

  CoffeescriptSource = (function(_super) {

    __extends(CoffeescriptSource, _super);

    CoffeescriptSource.types = ['coffeescript', 'coffee-script', 'cs'];

    CoffeescriptSource.header = /^#\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m;

    CoffeescriptSource.ext = '.coffee';

    function CoffeescriptSource(options, package) {
      if (options.output == null) {
        throw "Coffeescript source needs a 'output' options";
      }
      _.defaults(options, {
        follow: true
      });
      this.follow = options.follow, this.output = options.output;
      CoffeescriptSource.__super__.constructor.apply(this, arguments);
    }

    CoffeescriptSource.prototype.createFile = function(path) {
      var original;
      this.createCompiledFile(original = CoffeescriptSource.__super__.createFile.apply(this, arguments));
      return original;
    };

    CoffeescriptSource.prototype.createCompiledFile = function(original) {
      var compiled, cpath;
      cpath = util.changeext((path = original.relpath), '.js');
      compiled = new File(path, path.join(this.output, cpath), 'javascript', this);
      compiled.dependOn(original, _.bind(this.compile, this));
      compiled.setImportedPaths(original.readImportedPaths);
      this.package.registerFile(compiled);
      return compiled;
    };

    CoffeescriptSource.prototype.compile = function(original, compiled, cb) {
      var compile;
      compile = function(data, cb) {
        return cb(null, (require('coffee-script')).compile(cf));
      };
      return original.transformTo(compiled, compile, function(err) {
        if (err) cb(err);
        finished('Compiled', original.fullpath);
        return cb();
      });
    };

    return CoffeescriptSource;

  })(Source);

  exports.CoffeescriptSource = CoffeescriptSource;

  Source.extend(CoffeescriptSource);

}).call(this);
