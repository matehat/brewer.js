(function() {
  var Source, StylesheetsPackage, StylesheetsSource, StylusSource, debug, finished, fs, path, showError, util, _, _ref, _ref2,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  util = require('../util');

  fs = require('fs');

  path = require('path');

  _ = require('underscore');

  Source = require('..').Source;

  _ref = require('../command'), finished = _ref.finished, debug = _ref.debug, showError = _ref.showError;

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
      var compiled, cpath, opath;
      cpath = util.changeext((opath = original.relpath), '.css');
      compiled = this.package.file(opath, 'stylesheets', path.join(this.output, cpath), this);
      compiled.dependOn(original, _.bind(this.compile, this));
      compiled.setImportedPaths(original.readImportedPaths());
      compiled.impermanent = true;
      this.package.registerFile(compiled);
      return compiled;
    };

    StylusSource.prototype.compile = function(original, compiled, cb) {
      var compile,
        _this = this;
      compile = function(data, cb2) {
        var mod, module, parser, src, _i, _len, _ref3;
        parser = require('stylus')(data);
        parser.set('filename', _this.file);
        parser.set('paths', (function() {
          var _i, _len, _ref3, _results;
          _ref3 = this.package.sources.stylus;
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            src = _ref3[_i];
            _results.push(src.path);
          }
          return _results;
        }).call(_this));
        _ref3 = _this.package.vendorlibs.libraries('stylus');
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          mod = _ref3[_i];
          module = require(path.resolve(mod.path));
          if (_.isFunction(module)) parser.use(module());
        }
        return parser.render(function(err, css) {
          if (err != null) {
            showError('in', original.fullpath, ':', err.message);
            return cb();
          } else {
            return cb2(null, css);
          }
        });
      };
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
