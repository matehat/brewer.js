(function() {
  var Bundle, Source, StylesheetsBundle, StylesheetsPackage, StylesheetsSource, StylusBundle, StylusSource, debug, finished, fs, path, util, _, _ref, _ref2,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  util = require('../util');

  fs = require('fs');

  path = require('path');

  _ = require('underscore');

  Source = require('..').Source;

  Bundle = require('../bundle').Bundle;

  _ref = require('../command'), finished = _ref.finished, debug = _ref.debug;

  _ref2 = require('./css'), StylesheetsPackage = _ref2.StylesheetsPackage, StylesheetsSource = _ref2.StylesheetsSource, StylesheetsBundle = _ref2.StylesheetsBundle;

  this.StylusBundle = StylusBundle = (function(_super) {

    __extends(StylusBundle, _super);

    function StylusBundle() {
      StylusBundle.__super__.constructor.apply(this, arguments);
    }

    StylusBundle.prototype.stylus = function(data) {
      return this.setOptions(require('stylus')(data));
    };

    StylusBundle.prototype.importPath = function(src, file) {
      if (src instanceof StylusSource) {
        return path.join(src.path, util.changeExtension(file, src.constructor.ext));
      } else {
        return StylusBundle.__super__.importPath.call(this, src, file);
      }
    };

    StylusBundle.prototype.importPaths = function() {
      var src, _i, _len, _ref3, _results;
      _ref3 = this.package.sources;
      _results = [];
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        src = _ref3[_i];
        if (src instanceof StylusSource) _results.push(path.join(src.stylus_path));
      }
      return _results;
    };

    StylusBundle.prototype.setOptions = function(styl) {
      var mod, module, opts, _i, _len, _ref3;
      styl.set('paths', this.importPaths());
      styl.set('filename', this.file);
      opts = this.package.source(this.file).options;
      _ref3 = this.package.vendor.dirs('stylus');
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        mod = _ref3[_i];
        module = require(path.resolve(mod));
        if (_.isFunction(module)) styl.use(module());
      }
      return styl;
    };

    StylusBundle.prototype.convertFile = function(data, cb) {
      var _this = this;
      return this.stylus(data).render(function(err, css) {
        if (err) throw err;
        return cb(css);
      });
    };

    return StylusBundle;

  })(StylesheetsBundle);

  this.StylusSource = StylusSource = (function(_super) {

    __extends(StylusSource, _super);

    StylusSource.types = ['stylus', 'styl'];

    StylusSource.ext = StylusBundle.ext = '.styl';

    StylusSource.buildext = StylusBundle.buildext = '.css';

    StylusSource.header = /^\/\/\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m;

    StylusSource.Bundle = StylusBundle;

    function StylusSource(options, package) {
      _.defaults(options, {
        compileAll: false
      });
      StylusSource.__super__.constructor.apply(this, arguments);
      this.css_path = this.output;
      this.stylus_path = this.path;
    }

    StylusSource.prototype.find = function(rel) {
      var fullPath;
      if ((fullPath = StylusSource.__super__.find.call(this, rel)) !== false) {
        return fullPath;
      }
      rel = util.changeExtension(rel, this.constructor.ext);
      fullPath = path.join(this.path, rel);
      if (path.existsSync(fullPath)) {
        return fullPath;
      } else {
        return false;
      }
    };

    StylusSource.prototype.test = function(relpath) {
      var _ref3;
      return _ref3 = path.extname(relpath), __indexOf.call(this.constructor.ext, _ref3) >= 0;
    };

    StylusSource.prototype.compileAll = function(cb) {
      if (this.options.compileAll) {
        return StylusSource.__super__.compileAll.call(this, cb);
      } else {
        return cb();
      }
    };

    StylusSource.prototype.compileFile = function(relpath, next) {
      return (new StylusBundle(this.package, relpath)).bundle(function() {
        return next();
      });
    };

    return StylusSource;

  })(StylesheetsSource);

  Source.extend(StylusSource);

}).call(this);
