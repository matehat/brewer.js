(function() {
  var Brewer, Bundle, JavascriptBrewer, JavascriptBundle, JavascriptSource, Source, fs, path, util, _, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  fs = require('fs');

  path = require('path');

  util = require('../util');

  _ref = require('..'), Brewer = _ref.Brewer, Source = _ref.Source;

  Bundle = require('../bundle').Bundle;

  this.JavascriptBrewer = JavascriptBrewer = (function(_super) {

    __extends(JavascriptBrewer, _super);

    JavascriptBrewer.types = ['js', 'javascript'];

    function JavascriptBrewer(options) {
      _.defaults(options, {
        compress: true,
        compressed_name: "<%= filename %>.min.js"
      });
      JavascriptBrewer.__super__.constructor.call(this, options);
      this.compressed = options.compressed, this.build = options.build, this.bundles = options.bundles, this.compressed_name = options.compressed_name;
      this.compressed_name = _.template(this.compressed_name);
      if (_.isString(this.bundles)) {
        this.bundles = JSON.parse(fs.readFileSync(this.bundles));
      }
    }

    JavascriptBrewer.prototype.shouldFollow = function(relpath) {
      return this.source(relpath).follow;
    };

    JavascriptBrewer.prototype.compressible = function(relpath) {
      return path.join(this.source(relpath).js_path, util.changeExtension(relpath, '.js'));
    };

    JavascriptBrewer.prototype.compressAll = function(cb) {
      var _this = this;
      if (!this.compressed) return;
      return this.compileAll(function() {
        return _.each(_this.bundles, function(bundle) {
          return _this.compress(bundle, function(pkg) {
            console.log("Finished compressing " + bundle + " -> " + pkg);
            return cb();
          });
        });
      });
    };

    JavascriptBrewer.prototype.packageAll = function(cb) {
      var _this = this;
      return this.compileAll(function() {
        return _.each(_this.bundles, function(bundle) {
          return _this.package(bundle, function(pkg) {
            console.log("Finished packaging " + bundle + " -> " + pkg);
            return cb();
          });
        });
      });
    };

    return JavascriptBrewer;

  })(Brewer);

  this.JavascriptBundle = JavascriptBundle = (function(_super) {

    __extends(JavascriptBundle, _super);

    function JavascriptBundle(brewer, file) {
      this.brewer = brewer;
      this.file = file;
      this.ext = '.js';
      this.uglify = require('uglify-js');
      JavascriptBundle.__super__.constructor.call(this, this.brewer, this.file);
    }

    JavascriptBundle.prototype.bundle = function(cb) {
      var _this = this;
      return JavascriptBundle.__super__.bundle.call(this, function(data) {
        var fp;
        util.makedirs(path.dirname(fp = _this.filepath()));
        return fs.writeFile(fp, data, 'utf-8', function() {
          return cb(fp);
        });
      });
    };

    JavascriptBundle.prototype.compress = function(cb) {
      var ast_mangle, ast_squeeze, gen_code, parser, uglify, _ref2,
        _this = this;
      _ref2 = this.uglify, parser = _ref2.parser, uglify = _ref2.uglify;
      gen_code = uglify.gen_code, ast_squeeze = uglify.ast_squeeze, ast_mangle = uglify.ast_mangle;
      return this.brewer.deps(this.file, function(files) {
        _this.files = files;
        _this.stream = '';
        return _this.readFile(0, function(data) {
          var fp;
          util.makedirs(path.dirname(fp = _this.compressed));
          return fs.writeFile(fp, data, 'utf-8', function() {
            return cb(fp);
          });
        }, function(data) {
          return gen_code(ast_squeeze(parser.parse(data))) + ';';
        });
      });
    };

    return JavascriptBundle;

  })(Bundle);

  this.JavascriptSource = JavascriptSource = (function(_super) {

    __extends(JavascriptSource, _super);

    JavascriptSource.types = ['js', 'javascript'];

    JavascriptSource.Bundle = JavascriptBundle;

    function JavascriptSource(options) {
      _.defaults(options, {
        follow: true
      });
      JavascriptSource.__super__.constructor.call(this, options);
      this.follow = options.follow;
      this.ext = '.js';
      this.headerRE = /^\/\/\s*require\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/]+)/;
      this.js_path = this.path;
    }

    return JavascriptSource;

  })(Source);

  Source.extend(JavascriptSource);

  Brewer.extend(JavascriptBrewer);

}).call(this);
