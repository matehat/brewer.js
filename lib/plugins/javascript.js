(function() {
  var Bundle, JavascriptPackage, JavascriptSource, Package, Source, finished, fs, path, util, _, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  fs = require('fs');

  path = require('path');

  _ref = require('..'), Package = _ref.Package, Source = _ref.Source;

  util = require('../util');

  Bundle = require('../bundle').Bundle;

  finished = require('../command').finished;

  JavascriptPackage = (function(_super) {

    __extends(JavascriptPackage, _super);

    JavascriptPackage.types = ['javascript', 'js'];

    JavascriptPackage["default"] = 'javascript';

    function JavascriptPackage(options, sources, vendor) {
      var lib, _i, _len, _ref2;
      JavascriptPackage.__super__.constructor.apply(this, arguments);
      _.defaults(options, {
        compress: true
      });
      this.compress = options.compress, this.build = options.build, this.bundles = options.bundles;
      if (_.isString(this.bundles)) {
        this.bundles = JSON.parse(fs.readFileSync(this.bundles));
      }
      _ref2 = this.vendor.dirs('js');
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        lib = _ref2[_i];
        this.registerSource(Source.create({
          path: lib,
          type: 'js'
        }, this));
      }
    }

    JavascriptPackage.prototype.bundlePath = function(file) {
      return path.join(this.build, util.changeext(file.relpath, '.js'));
    };

    JavascriptPackage.prototype.compressedPath = function(file) {
      return path.join(this.build, compress === true ? util.changeext(file.relpath, '.min.js') : _.template(compress)({
        filename: file.relpath
      }));
    };

    JavascriptPackage.prototype.compress = function(original, dest, cb) {
      ({
        compress: function(data, cb) {
          var ast_mangle, ast_squeeze, gen_code, parser, uglify, _ref2;
          _ref2 = require('uglify-js'), parser = _ref2.parser, uglify = _ref2.uglify;
          gen_code = uglify.gen_code, ast_squeeze = uglify.ast_squeeze, ast_mangle = uglify.ast_mangle;
          return cb(null, gen_code(ast_squeeze(parser.parse(data))));
        }
      });
      return original.transformInto(dest, compress, function(err) {
        if (err) cb(err);
        finished('Compressed', original.fullpath);
        return cb();
      });
    };

    return JavascriptPackage;

  })(Package);

  JavascriptSource = (function(_super) {

    __extends(JavascriptSource, _super);

    function JavascriptSource() {
      JavascriptSource.__super__.constructor.apply(this, arguments);
    }

    JavascriptSource.types = ['js', 'javascript'];

    JavascriptSource.ext = '.js';

    JavascriptSource.header = /^\/\/\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m;

    return JavascriptSource;

  })(Source);

  Source.extend(JavascriptSource);

  Package.extend(JavascriptPackage);

  _.extend(exports, {
    JavascriptSource: JavascriptSource,
    JavascriptPackage: JavascriptPackage
  });

}).call(this);
