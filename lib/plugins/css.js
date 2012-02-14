(function() {
  var Bundle, Package, Source, StylesheetsPackage, StylesheetsSource, debug, finished, fs, path, util, _, _ref, _ref2,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  fs = require('fs');

  path = require('path');

  util = require('../util');

  _ref = require('..'), Package = _ref.Package, Source = _ref.Source, Bundle = _ref.Bundle;

  _ref2 = require('../command'), finished = _ref2.finished, debug = _ref2.debug;

  StylesheetsPackage = (function(_super) {

    __extends(StylesheetsPackage, _super);

    StylesheetsPackage.type = 'stylesheets';

    StylesheetsPackage.aliases = ['css'];

    function StylesheetsPackage(options) {
      var lib, _i, _len, _ref3;
      StylesheetsPackage.__super__.constructor.apply(this, arguments);
      _.defaults(options, {
        compress: true
      });
      this.compress = options.compress, this.build = options.build, this.bundles = options.bundles;
      if (_.isString(this.bundles)) {
        this.bundles = JSON.parse(fs.readFileSync(this.bundles));
      }
      _ref3 = this.vendorlibs.libraries('stylesheets');
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        lib = _ref3[_i];
        if (lib.watch == null) lib.watch = false;
        this.registerSource(Source.create(lib, this));
      }
    }

    StylesheetsPackage.prototype.bundlePath = function(file) {
      return path.join(this.build, util.changeext(file.relpath, '.css'));
    };

    StylesheetsPackage.prototype.compressedPath = function(file) {
      return path.join(this.build, this.compress === true ? util.changeext(file.relpath, '.min.css') : _.template(compress)({
        filename: file.relpath
      }));
    };

    StylesheetsPackage.prototype.compressFile = function(original, dest, cb) {
      var compress;
      compress = function(data, cb) {
        return cb(null, (require('ncss'))(data));
      };
      return original.project(dest, compress, function(err) {
        if (err) cb(err);
        finished('Compressed', original.fullpath);
        return cb();
      });
    };

    return StylesheetsPackage;

  })(Package);

  StylesheetsSource = (function(_super) {

    __extends(StylesheetsSource, _super);

    function StylesheetsSource() {
      StylesheetsSource.__super__.constructor.apply(this, arguments);
    }

    StylesheetsSource.type = 'stylesheets';

    StylesheetsSource.aliases = ['css'];

    StylesheetsSource.ext = '.css';

    StylesheetsSource.header = /^\/\*\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)\*\//m;

    return StylesheetsSource;

  })(Source);

  Source.extend(StylesheetsSource);

  Package.extend(StylesheetsPackage);

  _.extend(exports, {
    StylesheetsPackage: StylesheetsPackage,
    StylesheetsSource: StylesheetsSource
  });

}).call(this);
