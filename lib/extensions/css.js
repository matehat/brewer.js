(function() {
  var Package, Source, StylesheetsPackage, StylesheetsSource, debug, finished, _ref, _ref2,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __slice = Array.prototype.slice;

  _ref = require('..'), Package = _ref.Package, Source = _ref.Source;

  _ref2 = require('../command'), finished = _ref2.finished, debug = _ref2.debug;

  StylesheetsPackage = (function(_super) {

    __extends(StylesheetsPackage, _super);

    function StylesheetsPackage() {
      StylesheetsPackage.__super__.constructor.apply(this, arguments);
    }

    StylesheetsPackage.type = 'stylesheets';

    StylesheetsPackage.aliases = ['css'];

    StylesheetsPackage.compressedext = '.min.css';

    StylesheetsPackage.ext = '.css';

    StylesheetsPackage.prototype.requiredModules = function() {
      return __slice.call(StylesheetsPackage.__super__.requiredModules.call(this)).concat(['css-compressor']);
    };

    StylesheetsPackage.prototype.compressFile = function(original, dest, cb) {
      var compress, cssmin;
      cssmin = require('css-compressor').cssmin;
      compress = function(data, cb2) {
        return cb2(null, cssmin(data));
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

    StylesheetsSource.header = /^\/\*\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)\*\//m;

    StylesheetsSource.ext = '.css';

    return StylesheetsSource;

  })(Source);

  Source.extend(StylesheetsSource);

  Package.extend(StylesheetsPackage);

}).call(this);
