(function() {
  var JavascriptPackage, JavascriptSource, Package, Source, debug, finished, _ref, _ref2,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __slice = Array.prototype.slice;

  _ref = require('..'), Package = _ref.Package, Source = _ref.Source;

  _ref2 = require('../command'), finished = _ref2.finished, debug = _ref2.debug;

  JavascriptPackage = (function(_super) {

    __extends(JavascriptPackage, _super);

    function JavascriptPackage() {
      JavascriptPackage.__super__.constructor.apply(this, arguments);
    }

    JavascriptPackage.type = 'javascript';

    JavascriptPackage.aliases = ['js'];

    JavascriptPackage.compressedext = '.min.js';

    JavascriptPackage.ext = '.js';

    JavascriptPackage.prototype.requiredModules = function() {
      return __slice.call(JavascriptPackage.__super__.requiredModules.call(this)).concat(['uglify-js']);
    };

    JavascriptPackage.prototype.compressFile = function(original, dest, cb) {
      var compress;
      compress = function(data, cb) {
        var ast_mangle, ast_squeeze, gen_code, parser, uglify, _ref3;
        _ref3 = require('uglify-js'), parser = _ref3.parser, uglify = _ref3.uglify;
        gen_code = uglify.gen_code, ast_squeeze = uglify.ast_squeeze, ast_mangle = uglify.ast_mangle;
        return cb(null, gen_code(ast_squeeze(parser.parse(data))));
      };
      return original.project(dest, compress, function(err) {
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

    JavascriptSource.type = 'javascript';

    JavascriptSource.aliases = ['js'];

    JavascriptSource.ext = '.js';

    JavascriptSource.header = /^\/\/\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m;

    return JavascriptSource;

  })(Source);

  Source.extend(JavascriptSource);

  Package.extend(JavascriptPackage);

}).call(this);
