(function() {
  var Source, StylesheetsPackage, StylesheetsSource, StylusSource, debug, finished, fs, path, util, _, _ref, _ref2,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  util = require('../util');

  fs = require('fs');

  path = require('path');

  _ = require('underscore');

  Source = require('..').Source;

  _ref = require('../command'), finished = _ref.finished, debug = _ref.debug;

  _ref2 = require('./css'), StylesheetsPackage = _ref2.StylesheetsPackage, StylesheetsSource = _ref2.StylesheetsSource;

  StylusSource = (function(_super) {

    __extends(StylusSource, _super);

    StylusSource.type = 'stylus';

    StylusSource.aliases = ['styl'];

    StylusSource.ext = '.styl';

    StylusSource.header = /^\/\/\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m;

    function StylusSource(options) {
      this.output = options.output;
      StylusSource.__super__.constructor.apply(this, arguments);
    }

    StylusSource.prototype.createFile = function(path) {
      var original;
      this.createCompiledFile(original = StylusSource.__super__.createFile.apply(this, arguments));
      return original;
    };

    StylusSource.prototype.createCompiledFile = function(original) {
      var compiled, cpath;
      cpath = util.changeext((path = original.relpath), '.css');
      compiled = this.package.file(path, 'stylesheets', path.join(this.output, cpath), this);
      compiled.dependOn(original, _.bind(this.compile, this));
      compiled.setImportedPaths(original.readImportedPaths);
      this.package.registerFile(compiled);
      return compiled;
    };

    StylusSource.prototype.compile = function(original, compiled, cb) {
      var mod, module, parser, src, _i, _len, _ref3;
      parser = require('stylus');
      parser.set('filename', this.file);
      parser.set('paths', (function() {
        var _i, _len, _ref3, _results;
        _ref3 = this.package.sources.stylus;
        _results = [];
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          src = _ref3[_i];
          _results.push(src.path);
        }
        return _results;
      }).call(this));
      _ref3 = this.package.vendor.dirs('stylus');
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        mod = _ref3[_i];
        module = require(path.resolve(mod));
        if (_.isFunction(module)) styl.use(module());
      }
      ({
        compile: function(data, cb) {
          return parser(data).render(function(err, css) {
            if (err != null) cb(err);
            return cb(null, css);
          });
        }
      });
      return original.project(compiled, compile, function(err) {
        if (err) cb(err);
        finished('Compiled', original.fullpath);
        return cb();
      });
    };

    return StylusSource;

  })(StylesheetsSource);

  Source.extend(exports.StylusSource = StylusSource);

}).call(this);
