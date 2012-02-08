(function() {
  var Bundle, Package, Source, StylesheetsBundle, StylesheetsPackage, StylesheetsSource, debug, finished, fs, path, util, _, _ref, _ref2,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  fs = require('fs');

  path = require('path');

  util = require('../util');

  _ref = require('..'), Package = _ref.Package, Source = _ref.Source, Bundle = _ref.Bundle;

  _ref2 = require('../command'), finished = _ref2.finished, debug = _ref2.debug;

  this.StylesheetsPackage = StylesheetsPackage = (function(_super) {

    __extends(StylesheetsPackage, _super);

    StylesheetsPackage.types = ['css', 'stylesheets'];

    StylesheetsPackage["default"] = 'css';

    function StylesheetsPackage(options, sources, vendor) {
      var compress, lib, _i, _len, _ref3;
      StylesheetsPackage.__super__.constructor.apply(this, arguments);
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
      _ref3 = this.vendor.dirs('css');
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        lib = _ref3[_i];
        this.sources.push(Source.create({
          path: lib,
          type: 'css'
        }, this));
      }
    }

    return StylesheetsPackage;

  })(Package);

  this.StylesheetsBundle = StylesheetsBundle = (function(_super) {

    __extends(StylesheetsBundle, _super);

    function StylesheetsBundle() {
      StylesheetsBundle.__super__.constructor.apply(this, arguments);
    }

    StylesheetsBundle.ext = '.css';

    StylesheetsBundle.prototype.importPath = function(src, file) {
      var ctor, _ref3, _ref4;
      return path.join((_ref3 = src.output) != null ? _ref3 : src.path, util.changeExtension(file, (_ref4 = (ctor = src.constructor).buildext) != null ? _ref4 : ctor.ext));
    };

    StylesheetsBundle.prototype.sourcePath = function(i) {
      var file;
      file = (i != null) && i < this.files.length ? this.files[i] : this.file;
      return this.importPath(this.package.source(file), file);
    };

    StylesheetsBundle.prototype.compressFile = function(data, cb) {
      return cb((require('ncss'))(data));
    };

    return StylesheetsBundle;

  })(Bundle);

  this.StylesheetsSource = StylesheetsSource = (function(_super) {

    __extends(StylesheetsSource, _super);

    function StylesheetsSource() {
      StylesheetsSource.__super__.constructor.apply(this, arguments);
    }

    StylesheetsSource.types = ['css', 'stylesheets'];

    StylesheetsSource.ext = StylesheetsBundle.ext = '.css';

    StylesheetsSource.header = /^\/\*\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)\*\//m;

    StylesheetsSource.Bundle = StylesheetsBundle;

    StylesheetsSource.prototype.test = function(path) {
      return util.hasExtension(path, '.css');
    };

    return StylesheetsSource;

  })(Source);

  Source.extend(StylesheetsSource);

  Package.extend(StylesheetsPackage);

}).call(this);
