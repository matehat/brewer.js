(function() {
  var Bundle, Source, StylesheetsBrewer, StylesheetsBundle, StylesheetsSource, StylusBundle, StylusSource, finished, fs, path, util, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  util = require('../util');

  fs = require('fs');

  path = require('path');

  Source = require('..').Source;

  Bundle = require('../bundle').Bundle;

  finished = require('../command').finished;

  _ref = require('./css'), StylesheetsBrewer = _ref.StylesheetsBrewer, StylesheetsSource = _ref.StylesheetsSource, StylesheetsBundle = _ref.StylesheetsBundle;

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
      var src, _i, _len, _ref2, _results;
      _ref2 = this.brewer.sources;
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        src = _ref2[_i];
        if (src instanceof StylusSource) _results.push(src.stylus_path);
      }
      return _results;
    };

    StylusBundle.prototype.setOptions = function(styl) {
      styl.set('paths', this.importPaths());
      return styl.set('filename', this.file);
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

    StylusSource.ext = StylusBundle.ext = ['.styl'];

    StylusSource.buildext = StylusBundle.buildext = '.css';

    StylusSource.header = /^\/\/\s*(?:import|require)\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m;

    StylusSource.Bundle = StylusBundle;

    function StylusSource(options, brewer) {
      this.brewer = brewer;
      _.defaults(options, {
        compileAll: false
      });
      StylusSource.__super__.constructor.call(this, options);
      this.css_path = this.path;
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
      var _ref2;
      return _ref2 = path.extname(relpath), __indexOf.call(this.constructor.ext, _ref2) >= 0;
    };

    StylusSource.prototype.compileAll = function(cb) {
      if (this.options.compileAll) {
        return StylusSource.__super__.compileAll.call(this, cb);
      } else {
        return cb();
      }
    };

    StylusSource.prototype.compileFile = function(relpath, next) {
      return (new StylusBundle(this.brewer, relpath)).bundle(function() {
        return next();
      });
    };

    return StylusSource;

  })(StylesheetsSource);

  Source.extend(StylusSource);

}).call(this);
