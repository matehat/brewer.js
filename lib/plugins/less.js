(function() {
  var LessSource, Source, StylesheetsPackage, StylesheetsSource, debug, finished, fs, path, util, _ref, _ref2,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  util = require('../util');

  fs = require('fs');

  path = require('path');

  Source = require('..').Source;

  _ref = require('../command'), finished = _ref.finished, debug = _ref.debug;

  _ref2 = require('./css'), StylesheetsPackage = _ref2.StylesheetsPackage, StylesheetsSource = _ref2.StylesheetsSource;

  LessSource = (function(_super) {

    __extends(LessSource, _super);

    LessSource.type = 'less';

    LessSource.ext = '.less';

    LessSource.header = /^\/\/\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m;

    function LessSource(options, package) {
      this.output = options.output;
      LessSource.__super__.constructor.apply(this, arguments);
    }

    LessSource.prototype.createFile = function(path) {
      var original;
      this.createCompiledFile(original = LessSource.__super__.createFile.apply(this, arguments));
      return original;
    };

    LessSource.prototype.createCompiledFile = function(original) {
      var compiled, cpath;
      cpath = util.changeext((path = original.relpath), '.css');
      compiled = this.package.file(path, 'stylesheets', path.join(this.output, cpath), this);
      compiled.dependOn(original, _.bind(this.compile, this));
      compiled.setImportedPaths(original.readImportedPaths);
      this.package.registerFile(compiled);
      return compiled;
    };

    LessSource.prototype.compile = function(original, compiled, cb) {
      var lib, parser, paths, src, _i, _len, _ref3;
      paths = (function() {
        var _i, _len, _ref3, _results;
        _ref3 = this.package.sources.less;
        _results = [];
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          src = _ref3[_i];
          _results.push(src.path);
        }
        return _results;
      }).call(this);
      _ref3 = this.package.vendor.dirs('less');
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        lib = _ref3[_i];
        paths.push(lib);
      }
      parser = new (require('less').Parser)({
        filename: this.file,
        paths: paths
      });
      ({
        compile: function(data, cb) {
          return parser.parse(data, function(err, tree) {
            if (err != null) cb(err);
            return cb(null, tree.toCSS());
          });
        }
      });
      return original.project(compiled, compile, function(err) {
        if (err) cb(err);
        finished('Compiled', original.fullpath);
        return cb();
      });
    };

    return LessSource;

  })(StylesheetsSource);

  Source.extend(exports.LessSource = LessSource);

}).call(this);
