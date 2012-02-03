(function() {
  var Bundle, LessBundle, LessSource, Source, StylesheetsBrewer, StylesheetsBundle, StylesheetsSource, debug, finished, fs, path, util, _ref, _ref2,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  util = require('../util');

  fs = require('fs');

  path = require('path');

  Source = require('..').Source;

  Bundle = require('../bundle').Bundle;

  _ref = require('../command'), finished = _ref.finished, debug = _ref.debug;

  _ref2 = require('./css'), StylesheetsBrewer = _ref2.StylesheetsBrewer, StylesheetsSource = _ref2.StylesheetsSource, StylesheetsBundle = _ref2.StylesheetsBundle;

  this.LessBundle = LessBundle = (function(_super) {

    __extends(LessBundle, _super);

    LessBundle.buildext = '.css';

    function LessBundle(brewer, file) {
      this.brewer = brewer;
      this.file = file;
      LessBundle.__super__.constructor.call(this, this.brewer, this.file);
    }

    LessBundle.prototype.importPath = function(src, file) {
      if (src instanceof LessSource) {
        return path.join(src.path, util.changeExtension(file, src.constructor.ext));
      } else {
        return LessBundle.__super__.importPath.call(this, src, file);
      }
    };

    LessBundle.prototype.less = function() {
      var paths, src;
      paths = (function() {
        var _i, _len, _ref3, _ref4, _results;
        _ref3 = this.brewer.sources;
        _results = [];
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          src = _ref3[_i];
          _results.push((_ref4 = src.less_path) != null ? _ref4 : src.css_path);
        }
        return _results;
      }).call(this);
      return new (require('less').Parser)({
        filename: this.file,
        paths: paths
      });
    };

    LessBundle.prototype.convertFile = function(data, cb) {
      var _this = this;
      return this.less().parse(data, function(err, tree) {
        if (err) throw err;
        return cb(tree.toCSS());
      });
    };

    return LessBundle;

  })(StylesheetsBundle);

  this.LessSource = LessSource = (function(_super) {

    __extends(LessSource, _super);

    LessSource.types = ['less'];

    LessSource.ext = LessBundle.ext = '.less';

    LessSource.buildext = LessBundle.buildext = '.css';

    LessSource.header = /^\/\/\s*(?:import|require)\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m;

    LessSource.Bundle = LessBundle;

    function LessSource(options, brewer) {
      this.brewer = brewer;
      _.defaults(options, {
        compileAll: false
      });
      this.output = options.output;
      LessSource.__super__.constructor.call(this, options);
      this.less_path = this.path;
      this.css_path = this.output;
    }

    LessSource.prototype.find = function(rel) {
      var fullPath;
      if ((fullPath = LessSource.__super__.find.call(this, rel)) !== false) {
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

    LessSource.prototype.test = function(relpath) {
      return path.extname(relpath) === '.less';
    };

    LessSource.prototype.compileAll = function(cb) {
      if (this.options.compileAll) {
        return LessSource.__super__.compileAll.call(this, cb);
      } else {
        return cb();
      }
    };

    LessSource.prototype.compileFile = function(relpath, next) {
      return (new LessBundle(this.brewer, relpath)).bundle(function() {
        return next();
      });
    };

    return LessSource;

  })(StylesheetsSource);

  Source.extend(LessSource);

}).call(this);
