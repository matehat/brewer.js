(function() {
  var Brewer, Bundle, JavascriptBrewer, JavascriptBundle, JavascriptSource, Source, finished, fs, path, util, _, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _ = require('underscore');

  fs = require('fs');

  path = require('path');

  util = require('../util');

  _ref = require('..'), Brewer = _ref.Brewer, Source = _ref.Source;

  Bundle = require('../bundle').Bundle;

  finished = require('../command').finished;

  this.JavascriptBrewer = JavascriptBrewer = (function(_super) {

    __extends(JavascriptBrewer, _super);

    JavascriptBrewer.types = ['js', 'javascript'];

    function JavascriptBrewer(options) {
      _.defaults(options, {
        compress: true,
        compressedFile: "<%= filename %>.min.js"
      });
      JavascriptBrewer.__super__.constructor.call(this, options);
      this.compressed = options.compressed, this.build = options.build, this.bundles = options.bundles, this.compressedFile = options.compressedFile;
      this.compressedFile = _.template(this.compressedFile);
      if (_.isString(this.bundles)) {
        this.bundles = JSON.parse(fs.readFileSync(this.bundles));
      }
    }

    return JavascriptBrewer;

  })(Brewer);

  this.JavascriptBundle = JavascriptBundle = (function(_super) {

    __extends(JavascriptBundle, _super);

    function JavascriptBundle(brewer, file) {
      this.brewer = brewer;
      this.file = file;
      this.ext = '.js';
      JavascriptBundle.__super__.constructor.call(this, this.brewer, this.file);
    }

    JavascriptBundle.prototype.sourcePath = function(i) {
      var file;
      file = i < this.files.length ? this.files[i] : this.file;
      return path.join(this.brewer.source(file).js_path, util.changeExtension(file, '.js'));
    };

    JavascriptBundle.prototype.bundle = function(cb) {
      var _this = this;
      return JavascriptBundle.__super__.bundle.call(this, function(data) {
        var fp;
        util.makedirs(path.dirname(fp = _this.buildPath()));
        return fs.writeFile(fp, data, 'utf-8', function() {
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

    JavascriptSource.types = ['js', 'javascript'];

    JavascriptSource.ext = JavascriptBundle.ext = '.js';

    JavascriptSource.header = /^\/\/\s*(?:import|require)\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m;

    JavascriptSource.Bundle = JavascriptBundle;

    function JavascriptSource(options) {
      JavascriptSource.__super__.constructor.call(this, options);
      this.js_path = this.path;
    }

    return JavascriptSource;

  })(Source);

  Source.extend(JavascriptSource);

  Brewer.extend(JavascriptBrewer);

}).call(this);
