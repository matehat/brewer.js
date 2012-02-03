(function() {
  var Brewer, Bundle, Source, StylesheetsBrewer, StylesheetsBundle, StylesheetsSource, finished, fs, path, util, _, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  fs = require('fs');

  path = require('path');

  util = require('../util');

  _ref = require('..'), Brewer = _ref.Brewer, Source = _ref.Source, Bundle = _ref.Bundle;

  finished = require('../command').finished;

  this.StylesheetsBrewer = StylesheetsBrewer = (function(_super) {

    __extends(StylesheetsBrewer, _super);

    StylesheetsBrewer.types = ['css', 'stylesheets'];

    function StylesheetsBrewer(options) {
      var compress;
      StylesheetsBrewer.__super__.constructor.call(this, options);
      _.defaults(options, {
        compress: true
      });
      compress = options.compress, this.build = options.build, this.bundles = options.bundles;
      if (_.isString(this.bundles)) {
        this.bundles = JSON.parse(fs.readFileSync(this.bundles));
      }
      if (compress) {
        this.compressedFile = _.template(_.isString(compress) ? compress : "<%= filename %>.min.css");
      }
    }

    return StylesheetsBrewer;

  })(Brewer);

  this.StylesheetsBundle = StylesheetsBundle = (function(_super) {

    __extends(StylesheetsBundle, _super);

    function StylesheetsBundle(brewer, file) {
      this.brewer = brewer;
      this.file = file;
      this.ext = '.css';
      StylesheetsBundle.__super__.constructor.call(this, this.brewer, this.file);
    }

    StylesheetsBundle.prototype.sourcePath = function(i) {
      var file, src, _ref2;
      file = (i != null) && i < this.files.length ? this.files[i] : this.file;
      src = this.brewer.source(file);
      return path.join((_ref2 = src.css_path) != null ? _ref2 : src.path, util.changeExtension(file, '.css'));
    };

    StylesheetsBundle.prototype.compressFile = function(data, cb) {
      return cb((require('ncss'))(data));
    };

    return StylesheetsBundle;

  })(Bundle);

  this.StylesheetsSource = StylesheetsSource = (function(_super) {

    __extends(StylesheetsSource, _super);

    StylesheetsSource.types = ['css', 'stylesheets'];

    StylesheetsSource.ext = StylesheetsBundle.ext = '.css';

    StylesheetsSource.header = /^\/\*\s*(?:require|import)\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)\*\//m;

    StylesheetsSource.Bundle = StylesheetsBundle;

    function StylesheetsSource(options) {
      StylesheetsSource.__super__.constructor.call(this, options);
    }

    StylesheetsSource.prototype.test = function(path) {
      return util.hasExtension(path, '.css');
    };

    return StylesheetsSource;

  })(Source);

  Source.extend(StylesheetsSource);

  Brewer.extend(StylesheetsBrewer);

}).call(this);
