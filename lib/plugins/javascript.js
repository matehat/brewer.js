(function() {
  var Bundle, JavascriptBundle, JavascriptPackage, JavascriptSource, Package, Source, finished, fs, path, util, _, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  fs = require('fs');

  path = require('path');

  _ref = require('..'), Package = _ref.Package, Source = _ref.Source;

  util = require('../util');

  Bundle = require('../bundle').Bundle;

  finished = require('../command').finished;

  this.JavascriptPackage = JavascriptPackage = (function(_super) {

    __extends(JavascriptPackage, _super);

    JavascriptPackage.types = ['js', 'javascript'];

    JavascriptPackage["default"] = 'javascript';

    function JavascriptPackage(options) {
      var compress;
      JavascriptPackage.__super__.constructor.call(this, options);
      _.defaults(options, {
        compress: true
      });
      compress = options.compress, this.build = options.build, this.bundles = options.bundles;
      if (_.isString(this.bundles)) {
        this.bundles = JSON.parse(fs.readFileSync(this.bundles));
      }
      if (compress) {
        this.compressedFile = _.template(_.isString(compress) ? compress : "<%= filename %>.min.js");
      }
    }

    return JavascriptPackage;

  })(Package);

  this.JavascriptBundle = JavascriptBundle = (function(_super) {

    __extends(JavascriptBundle, _super);

    function JavascriptBundle() {
      JavascriptBundle.__super__.constructor.apply(this, arguments);
    }

    JavascriptBundle.prototype.sourcePath = function(i) {
      var file, src, _ref2;
      file = i < this.files.length ? this.files[i] : this.file;
      src = this.package.source(file);
      return path.join((_ref2 = src.js_path) != null ? _ref2 : src.path, util.changeExtension(file, '.js'));
    };

    JavascriptBundle.prototype.compressFile = function(data, cb) {
      var ast_mangle, ast_squeeze, gen_code, parser, uglify, _ref2;
      _ref2 = require('uglify-js'), parser = _ref2.parser, uglify = _ref2.uglify;
      gen_code = uglify.gen_code, ast_squeeze = uglify.ast_squeeze, ast_mangle = uglify.ast_mangle;
      return cb(gen_code(ast_squeeze(parser.parse(data))));
    };

    return JavascriptBundle;

  })(Bundle);

  this.JavascriptSource = JavascriptSource = (function(_super) {

    __extends(JavascriptSource, _super);

    function JavascriptSource() {
      JavascriptSource.__super__.constructor.apply(this, arguments);
    }

    JavascriptSource.Bundle = JavascriptBundle;

    JavascriptSource.types = ['js', 'javascript'];

    JavascriptSource.ext = JavascriptBundle.ext = '.js';

    JavascriptSource.header = /^\/\/\s*(?:import|require)\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m;

    return JavascriptSource;

  })(Source);

  Source.extend(JavascriptSource);

  Package.extend(JavascriptPackage);

}).call(this);
