(function() {
  var Bundle, LessBundle, LessSource, Source, StylesheetsBrewer, StylesheetsBundle, StylesheetsSource, fs, path, util, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  util = require('../util');

  fs = require('fs');

  path = require('path');

  Source = require('..').Source;

  Bundle = require('../bundle').Bundle;

  _ref = require('./css'), StylesheetsBrewer = _ref.StylesheetsBrewer, StylesheetsSource = _ref.StylesheetsSource, StylesheetsBundle = _ref.StylesheetsBundle;

  this.LessBundle = LessBundle = (function(_super) {

    __extends(LessBundle, _super);

    function LessBundle(brewer, file) {
      var src;
      this.brewer = brewer;
      this.file = file;
      LessBundle.__super__.constructor.call(this, this.brewer, this.file);
      this.ext = this.brewer.source(this.file).ext;
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
        var fp;
        util.makedirs(path.dirname(fp = _this.buildPath()));
        return _this.parser.parse(data, function(err, tree) {
          if (err) throw err;
          return fs.writeFile(fp, tree.toCSS(), 'utf-8', function() {
            return cb(fp);
          });
        });
      });
    };

    LessBundle.prototype.sourcePath = function(i) {
      var file, src;
      file = i < this.files.length ? this.files[i] : this.file;
      return path.join((src = this.brewer.source(file)).css_path, util.changeExtension(file, src.ext));
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

    LessSource.Bundle = LessBundle;

    LessSource.types = ['less'];

    function LessSource(options) {
      _.defaults(options, {
        compileAll: false
      });
      LessSource.__super__.constructor.call(this, options);
      this.ext = '.less';
      this.css_path = this.path;
      this.headerRE = /^\/\/\s*(?:import|require)\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m;
    }

    LessSource.prototype.find = function(rel) {
      var fullPath;
      if ((fullPath = LessSource.__super__.find.call(this, rel)) !== false) {
        return fullPath;
      }
      rel = util.changeExtension(rel, this.ext);
      fullPath = path.join(this.path, rel);
      fullPath = path.join(path.dirname(fullPath), path.basename(fullPath));
      if (path.existsSync(fullPath)) {
        return fullPath;
      } else {
        return false;
      }
    };

    LessSource.prototype.test = function(path) {
      return path.extname(path) === '.less';
    };

    return LessSource;

  })(StylesheetsSource);

  Source.extend(LessSource);

}).call(this);
