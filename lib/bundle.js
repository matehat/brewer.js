(function() {
  var Bundle, CSSBundle, JavascriptBundle, SassBundle, fs, path, util,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  path = require('path');

  util = require('./util');

  fs = require('fs');

  Bundle = (function() {

    function Bundle(brewer, file) {
      this.brewer = brewer;
      this.file = file;
      this.basepath = path.join(this.brewer.build, this.file);
      this.compressed = this.brewer.compressed_name({
        filename: util.changeExtension(this.basepath, '')
      });
    }

    Bundle.prototype.filepath = function() {
      if (this._filepath == null) {
        this._filepath = util.changeExtension(this.basepath, this.ext);
      }
      return this._filepath;
    };

    Bundle.prototype.readFile = function(i, cb, mod) {
      var file, rs,
        _this = this;
      if (mod == null) {
        mod = (function(a) {
          return a;
        });
      }
      file = i < this.files.length ? this.files[i] : this.file;
      return rs = fs.readFile(path.resolve(this.brewer.compressible(file)), {
        encoding: 'utf-8'
      }, function(err, data) {
        if (err) throw err;
        _this.stream += mod(data.toString());
        return _this.nextFile(i, cb, mod);
      });
    };

    Bundle.prototype.nextFile = function(i, cb, mod) {
      if (i < this.files.length) {
        return this.readFile(i + 1, cb, mod);
      } else {
        cb(this.stream);
        return delete this.stream;
      }
    };

    Bundle.prototype.bundle = function(cb) {
      var _this = this;
      return this.brewer.deps(this.file, function(files) {
        _this.files = files;
        _this.stream = '';
        return _this.readFile(0, cb);
      });
    };

    return Bundle;

  })();

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
      var parser, uglify, _ref,
        _this = this;
      _ref = require('uglify-js'), parser = _ref.parser, uglify = _ref.uglify;
      return JavascriptBundle.__super__.bundle.call(this, function(data) {
        var fp;
        util.makedirs(path.dirname(fp = _this.filepath()));
        return fs.writeFile(fp, data, 'utf-8', function() {
          return cb(fp);
        });
      });
    };

    JavascriptBundle.prototype.compress = function(cb) {
      var ast_mangle, ast_squeeze, gen_code, parser, uglify, _ref,
        _this = this;
      _ref = require('uglify-js'), parser = _ref.parser, uglify = _ref.uglify;
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

  this.CSSBundle = CSSBundle = (function(_super) {

    __extends(CSSBundle, _super);

    function CSSBundle(brewer, file) {
      this.brewer = brewer;
      this.file = file;
      this.ext = '.css';
      this.ncss = require('ncss');
      CSSBundle.__super__.constructor.call(this, this.brewer, this.file);
    }

    CSSBundle.prototype.bundle = function(cb) {
      var _this = this;
      return CSSBundle.__super__.bundle.call(this, function(data) {
        var fp;
        util.makedirs(dirname(fp = _this.filepath()));
        return fs.writeFile(fp, data, 'utf-8', function() {
          return cb(fp);
        });
      });
    };

    CSSBundle.prototype.compress = function(cb) {
      var _this = this;
      return fs.readFile(this.filepath(), 'utf-8', function(err, data) {
        return fs.writeFile(_this.compressed, _this.ncss(data), 'utf-8', function() {
          return cb(_this.compressed);
        });
      });
    };

    return CSSBundle;

  })(Bundle);

  this.SassBundle = SassBundle = (function(_super) {

    __extends(SassBundle, _super);

    function SassBundle(brewer, file) {
      this.brewer = brewer;
      this.file = file;
      SassBundle.__super__.constructor.call(this, this.brewer(this.file));
      this.ext = '.sass';
      this.sass = require('sass');
    }

    SassBundle.prototype.filepath = function() {
      if (this._filepath == null) {
        this._filepath = util.changeExtension(this.basepath, '.css');
      }
      return this._filepath;
    };

    SassBundle.prototype.bundle = function(cb) {
      var _this = this;
      return SassBundle.__super__.bundle.call(this, function(data) {
        var fp;
        util.makedirs(dirname, fp = _this.filepath());
        return fs.writeFile(fp, _this.sass.render(data), 'utf-8', function() {
          return cb(fp);
        });
      });
    };

    return SassBundle;

  })(CSSBundle);

}).call(this);
