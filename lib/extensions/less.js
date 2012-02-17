(function() {
  var LessSource, Source, debug, finished, showError, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Source = require('..').Source;

  _ref = require('../command'), finished = _ref.finished, debug = _ref.debug, showError = _ref.showError;

  LessSource = (function(_super) {

    __extends(LessSource, _super);

    function LessSource() {
      LessSource.__super__.constructor.apply(this, arguments);
    }

    LessSource.type = 'less';

    LessSource.aliases = [];

    LessSource.ext = '.less';

    LessSource.header = /^\/\/\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m;

    LessSource.prototype.createFile = function(path) {
      var original;
      original = LessSource.__super__.createFile.apply(this, arguments);
      this.createCompiledFile(original);
      return original;
    };

    LessSource.prototype.requiredModules = function() {
      return ['less'];
    };

    LessSource.prototype.createCompiledFile = function(original) {
      var compiled, cpath, opath;
      cpath = (require('../util')).changeext((opath = original.relpath), '.css');
      compiled = this.package.file(opath, 'stylesheets', (require('path')).join(this.output, cpath), this);
      compiled.dependOn(original, (require('underscore')).bind(this.compile, this));
      compiled.setImportedPaths(original.readImportedPaths());
      compiled.impermanent = true;
      compiled.register();
      return compiled;
    };

    LessSource.prototype.compile = function(original, compiled, cb) {
      var compile, lib, parser, paths, resolve, src, _i, _len, _ref2;
      resolve = (require('path')).resolve;
      paths = (function() {
        var _i, _len, _ref2, _results;
        _ref2 = this.package.sources.less;
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          src = _ref2[_i];
          _results.push(resolve(src.path));
        }
        return _results;
      }).call(this);
      _ref2 = this.package.vendorlibs.libraries('less');
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        lib = _ref2[_i];
        paths.push(resolve(lib.path));
      }
      parser = new (require('less').Parser)({
        filename: original.fullpath,
        paths: paths
      });
      compile = function(data, cb2) {
        try {
          return parser.parse(data, function(err, tree) {
            if (err) {
              showError('in', original.fullpath, ':', err.message);
              return cb();
            } else {
              return cb2(null, tree.toCSS());
            }
          });
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

    return LessSource;

  })(Source);

  Source.extend(exports.LessSource = LessSource);

}).call(this);
