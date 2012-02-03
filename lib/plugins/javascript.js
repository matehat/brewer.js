(function() {
  var Brewer, Bundle, JavascriptBrewer, JavascriptBundle, JavascriptSource, Source, finished, fs, path, util, _, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  fs = require('fs');

  path = require('path');

  _ref = require('..'), Brewer = _ref.Brewer, Source = _ref.Source;

  util = require('../util');

  Bundle = require('../bundle').Bundle;

  finished = require('../command').finished;

  this.JavascriptBrewer = JavascriptBrewer = (function(_super) {

    __extends(JavascriptBrewer, _super);

    JavascriptBrewer.types = ['js', 'javascript'];

    function JavascriptBrewer(options) {
      var compress;
      JavascriptBrewer.__super__.constructor.call(this, options);
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

    return JavascriptBrewer;

  })(Brewer);

  this.JavascriptBundle = JavascriptBundle = (function(_super) {

    __extends(JavascriptBundle, _super);

    function JavascriptBundle() {
      JavascriptBundle.__super__.constructor.apply(this, arguments);
    }

    JavascriptBundle.prototype.sourcePath = function(i) {
      var file, src, _ref2;
      file = i < this.files.length ? this.files[i] : this.file;
      src = this.brewer.source(file);
      return path.join((_ref2 = src.js_path) != null ? _ref2 : src.path, util.changeExtension(file, '.js'));
    };

    JavascriptBundle.prototype.bundle = function(cb) {
      var _this = this;
      return JavascriptBundle.__super__.bundle.call(this, function(data) {
        var fp;
        return fs.writeFile(fp = _this.buildPath(), data, 'utf-8', function() {
          return cb(fp);
        });
      });
    };

    JavascriptBundle.prototype.compress = function(cb) {
      var ast_mangle, ast_squeeze, gen_code, parser, uglify, _ref2,
        _this = this;
      _ref2 = require('uglify-js'), parser = _ref2.parser, uglify = _ref2.uglify;
      gen_code = uglify.gen_code, ast_squeeze = uglify.ast_squeeze, ast_mangle = uglify.ast_mangle;
      return fs.readFile(this.buildPath(), 'utf-8', function(err, data) {
        var code, fp;
        code = gen_code(ast_squeeze(parser.parse(data)));
        return fs.writeFile((fp = _this.compressedFile), code, 'utf-8', function() {
          return cb(fp);
        });
      });
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

  Brewer.extend(JavascriptBrewer);

}).call(this);
