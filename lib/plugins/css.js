(function() {
  var Brewer, Bundle, Source, StylesheetsBrewer, StylesheetsBundle, StylesheetsSource, finished, fs, path, util, _, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  fs = require('fs');

  path = require('path');

  util = require('./../util');

  _ref = require('./..'), Brewer = _ref.Brewer, Source = _ref.Source;

  finished = require('../command').finished;

  Bundle = require('./../bundle').Bundle;

  this.StylesheetsBrewer = StylesheetsBrewer = (function(_super) {

    __extends(StylesheetsBrewer, _super);

    StylesheetsBrewer.types = ['css', 'stylesheets'];

    function StylesheetsBrewer(options) {
      _.defaults(options, {
        compressed: true,
        compressedFile: "<%= filename %>.min.css"
      });
      StylesheetsBrewer.__super__.constructor.call(this, options);
      this.compressed = options.compressed, this.build = options.build, this.bundles = options.bundles, this.compressedFile = options.compressedFile;
      this.compressedFile = _.template(this.compressedFile);
      if (_.isString(this.bundles)) {
        this.bundles = JSON.parse(fs.readFileSync(this.bundles));
      }
    }

    StylesheetsBrewer.prototype.compressAll = function(cb) {
      var _this = this;
      if (!this.compress) return;
      return _.each(this.bundles, function(bundle) {
        return _this.compress(bundle, function(pkg) {
          console.log('-', require('ansi-color').set('Compressed', 'blue'), pkg);
          return cb();
        });
      });
    };

    StylesheetsBrewer.prototype.packageAll = function(cb) {
      var _this = this;
      return _.each(this.bundles, function(bundle) {
        return _this.package(bundle, function(pkg) {
          finished('Packaged', pkg);
          return cb();
        });
      });
    };

    return StylesheetsBrewer;

  })(Brewer);

  this.StylesheetsBundle = StylesheetsBundle = (function(_super) {

    __extends(StylesheetsBundle, _super);

    function StylesheetsBundle(brewer, file) {
      this.brewer = brewer;
      this.file = file;
      this.ncss = require('ncss');
      this.ext = '.css';
      StylesheetsBundle.__super__.constructor.call(this, this.brewer, this.file);
    }

    StylesheetsBundle.prototype.sourcePath = function(i) {
      var file;
      file = i < this.files.length ? this.files[i] : this.file;
      return path.join(this.brewer.source(file).css_path, util.changeExtension(file, '.css'));
    };

    StylesheetsBundle.prototype.bundle = function(cb) {
      var _this = this;
      return StylesheetsBundle.__super__.bundle.call(this, function(data) {
        var fp;
        util.makedirs(path.dirname(fp = _this.buildPath()));
        return fs.writeFile(fp, data, 'utf-8', function() {
          return cb(fp);
        });
      });
    };

    StylesheetsBundle.prototype.compress = function(cb) {
      var _this = this;
      return fs.readFile(this.buildPath(), 'utf-8', function(err, data) {
        return fs.writeFile(_this.compressedFile, _this.ncss(data), 'utf-8', function() {
          return cb(_this.compressedFile);
        });
      });
    };

    return StylesheetsBundle;

  })(Bundle);

  this.StylesheetsSource = StylesheetsSource = (function(_super) {

    __extends(StylesheetsSource, _super);

    StylesheetsSource.types = ['css', 'stylesheets'];

    StylesheetsSource.Bundle = StylesheetsBundle;

    function StylesheetsSource(options) {
      StylesheetsSource.__super__.constructor.call(this, options);
      this.ext = '.css';
      this.css_path = this.path;
      this.headerRE = /^\/\*\s*(?:require|import)\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)\*\//m;
    }

    StylesheetsSource.prototype.test = function(path) {
      return util.hasExtension(path, '.css');
    };

    return StylesheetsSource;

  })(Source);

  Source.extend(StylesheetsSource);

  Brewer.extend(StylesheetsBrewer);

}).call(this);
