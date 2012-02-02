(function() {
  var SassBundle, SassSource, Source, StylesheetsBrewer, StylesheetsBundle, StylesheetsSource, fs, path, util, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  util = require('./../util');

  fs = require('fs');

  path = require('path');

  Source = require('./..').Source;

  _ref = require('./css'), StylesheetsBrewer = _ref.StylesheetsBrewer, StylesheetsSource = _ref.StylesheetsSource, StylesheetsBundle = _ref.StylesheetsBundle;

  this.SassBundle = SassBundle = (function(_super) {

    __extends(SassBundle, _super);

    function SassBundle(brewer, file) {
      this.brewer = brewer;
      this.file = file;
      SassBundle.__super__.constructor.call(this, this.brewer(this.file));
      this.ext = '.sass';
      this.sass = require('sass');
    }

    SassBundle.prototype.filepath = function() {
      if (this._filepath == null) {
        this._filepath = util.changeExtension(this.basepath, '.css');
      }
      return this._filepath;
    };

    SassBundle.prototype.bundle = function(cb) {
      var _this = this;
      return SassBundle.__super__.bundle.call(this, function(data) {
        var fp;
        util.makedirs(path.dirname, fp = _this.filepath());
        return fs.writeFile(fp, _this.sass.render(data), 'utf-8', function() {
          return cb(fp);
        });
      });
    };

    return SassBundle;

  })(StylesheetsBundle);

  this.SassSource = SassSource = (function(_super) {

    __extends(SassSource, _super);

    SassSource.Bundle = SassBundle;

    SassSource.types = ['sass'];

    function SassSource(options) {
      SassSource.__super__.constructor.call(this, options);
      this.ext = '.sass';
      this.headerRE = /^\/\/\s*require\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/;
      this.css_path = this.path;
    }

    SassSource.prototype.find = function(rel) {
      var fullpath;
      if ((fullpath = SassSource.__super__.find.call(this, rel)) !== false) {
        return fullpath;
      }
      rel = util.changeExtension(rel, this.ext);
      fullpath = path.join(this.path, rel);
      fullpath = path.join(path.dirname(fullpath), "_" + (basename(fullpath)));
      if (path.existsSync(fullpath)) {
        return fullpath;
      } else {
        return false;
      }
    };

    SassSource.prototype.test = function(path) {
      return path.basename(path)[0] !== '_' && path.extname(path) === '.sass';
    };

    return SassSource;

  })(StylesheetsSource);

  Source.extend(SassSource);

}).call(this);
