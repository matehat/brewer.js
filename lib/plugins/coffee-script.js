(function() {
  var CoffeescriptSource, File, JavascriptFile, Source, debug, finished, fs, path, showError, util, _, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  fs = require('fs');

  path = require('path');

  util = require('../util');

  _ref = require('../command'), debug = _ref.debug, finished = _ref.finished, showError = _ref.showError;

  Source = require('../source').Source;

  File = require('../file').File;

  JavascriptFile = require('./javascript').JavascriptFile;

  CoffeescriptSource = (function(_super) {

    __extends(CoffeescriptSource, _super);

    CoffeescriptSource.type = 'coffeescript';

    CoffeescriptSource.aliases = ['coffee-script', 'cs'];

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
      var compiled, cpath, fpath;
      cpath = util.changeext((fpath = original.relpath), '.js');
      compiled = this.package.file(fpath, 'javascript', path.join(this.output, cpath), this);
      compiled.dependOn(original, _.bind(this.compile, this));
      compiled.setImportedPaths(original.readImportedPaths());
      compiled.impermanent = true;
      compiled.register();
      return compiled;
    };

    CoffeescriptSource.prototype.compile = function(original, compiled, cb) {
      var compile;
      compile = function(data, cb2) {
        try {
          return cb2(null, (require('coffee-script')).compile(data));
        } catch (err) {
          showError('in', original.fullpath, ':', err.message);
          return cb();
        }
      };
      return original.project(compiled, compile, function(err) {
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
