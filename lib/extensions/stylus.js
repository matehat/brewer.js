(function() {
  var Source, StylusSource, debug, finished, showError, _, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  Source = require('..').Source;

  _ref = require('../command'), finished = _ref.finished, debug = _ref.debug, showError = _ref.showError;

  StylusSource = (function(_super) {

    __extends(StylusSource, _super);

    function StylusSource() {
      StylusSource.__super__.constructor.apply(this, arguments);
    }

    StylusSource.type = 'stylus';

    StylusSource.aliases = ['styl'];

    StylusSource.ext = '.styl';

    StylusSource.header = /^\/\/\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m;

    StylusSource.prototype.requiredModules = function() {
      return ['stylus'];
    };

    StylusSource.prototype.createFile = function(path) {
      var original;
      original = StylusSource.__super__.createFile.apply(this, arguments);
      this.createCompiledFile(original);
      return original;
    };

    StylusSource.prototype.createCompiledFile = function(original) {
      var compiled, cpath, opath;
      cpath = (require('../util')).changeext((opath = original.relpath), '.css');
      compiled = this.package.file(opath, 'stylesheets', (require('path')).join(this.output, cpath), this);
      compiled.dependOn(original, _.bind(this.compile, this));
      compiled.setImportedPaths(original.readImportedPaths());
      compiled.impermanent = true;
      compiled.register();
      return compiled;
    };

    StylusSource.prototype.compile = function(original, compiled, cb) {
      var compile,
        _this = this;
      compile = function(data, cb2) {
        var mod, module, parser, src, _i, _len, _ref2;
        parser = require('stylus')(data);
        parser.set('filename', _this.file);
        parser.set('paths', (function() {
          var _i, _len, _ref2, _results;
          _ref2 = this.package.sources.stylus;
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            src = _ref2[_i];
            _results.push(src.path);
          }
          return _results;
        }).call(_this));
        _ref2 = _this.package.vendorlibs.libraries('stylus');
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          mod = _ref2[_i];
          try {
            module = require((require('path')).resolve(mod.path));
            if (_.isFunction(module)) parser.use(module());
          } catch (err) {
            continue;
          }
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

  })(Source);

  Source.extend(exports.StylusSource = StylusSource);

}).call(this);
