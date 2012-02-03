(function() {
  var Bundle, LessBundle, LessSource, Source, StylesheetsBrewer, StylesheetsBundle, StylesheetsSource, finished, fs, path, util, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  util = require('../util');

  fs = require('fs');

  path = require('path');

  Source = require('..').Source;

  Bundle = require('../bundle').Bundle;

  finished = require('../command').finished;

  _ref = require('./css'), StylesheetsBrewer = _ref.StylesheetsBrewer, StylesheetsSource = _ref.StylesheetsSource, StylesheetsBundle = _ref.StylesheetsBundle;

  this.LessBundle = LessBundle = (function(_super) {

    __extends(LessBundle, _super);

    function LessBundle(brewer, file) {
      var src;
      this.brewer = brewer;
      this.file = file;
      LessBundle.__super__.constructor.call(this, this.brewer, this.file);
      this.buildext = '.css';
      this.less = require('less');
      this.parser = new this.less.Parser({
        filename: this.file,
        paths: (function() {
          var _i, _len, _ref2, _ref3, _results;
          _ref2 = this.brewer.sources;
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            src = _ref2[_i];
            _results.push((_ref3 = src.less_path) != null ? _ref3 : src.css_path);
          }
          return _results;
        }).call(this)
      });
    }

    LessBundle.prototype.bundle = function(cb) {
      var _this = this;
      return Bundle.prototype.bundle.call(this, function(data) {
        return _this.parser.parse(data, function(err, tree) {
          var fp;
          if (err) throw err;
          return fs.writeFile(fp = _this.buildPath(), tree.toCSS(), 'utf-8', function() {
            finished('Compiled', fp);
            return cb(fp);
          });
        });
      }, function() {
        var fp;
        finished('Unchanged', fp = _this.buildPath());
        return cb(fp);
      });
    };

    LessBundle.prototype.sourcePath = function(i) {
      var file, src;
      file = (i != null) && i < this.files.length ? this.files[i] : this.file;
      return path.join((src = this.brewer.source(file)).css_path, util.changeExtension(file, src.constructor.ext));
    };

    LessBundle.prototype.readFile = function(i, cb, mod) {
      var file, rs,
        _this = this;
      if (mod == null) {
        mod = (function(a) {
          return a;
        });
      }
      file = i < this.files.length ? this.files[i] : this.file;
      return rs = fs.readFile(this.sourcePath(i), {
        encoding: 'utf-8'
      }, function(err, data) {
        if (err) throw err;
        _this.stream += mod(data.toString()) + '\n';
        return _this.nextFile(i, cb, mod);
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
      LessSource.__super__.constructor.call(this, options);
      this.css_path = this.path;
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
      if (!this.options.compileAll) return cb();
      return LessSource.__super__.compileAll.call(this, cb);
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
