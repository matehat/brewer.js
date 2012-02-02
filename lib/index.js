(function() {
  var Brewer, JavascriptBrewer, SassBrewer, Source, StylesheetsBrewer, bundles, fs, path, sources, sys, util, _,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  path = require('path');

  sys = require('util');

  util = require('./util');

  fs = require('fs');

  _ = require('underscore');

  bundles = require('./bundle');

  sources = require('./source');

  Brewer = (function() {

    function Brewer(options) {
      var src;
      sources = options.sources, this.name = options.name;
      this.sources = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = sources.length; _i < _len; _i++) {
          src = sources[_i];
          _results.push(Source.create(src));
        }
        return _results;
      })();
      this.filecache = {};
    }

    Brewer.prototype.findFile = function(relpath, dep) {
      var fpath, loc, src, _i, _len, _ref;
      if (dep == null) dep = false;
      if ((loc = this.filecache[relpath]) != null) return loc;
      _ref = this.sources;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        src = _ref[_i];
        if (fpath = src.find(relpath)) {
          return this.filecache[relpath] = {
            path: fpath,
            source: src
          };
        }
      }
      throw "File not found: " + relpath;
    };

    Brewer.prototype.fullpath = function(relpath) {
      return this.findFile(relpath).path;
    };

    Brewer.prototype.source = function(relpath) {
      return this.findFile(relpath).source;
    };

    Brewer.prototype.compressible = function(relpath) {
      return this.source(relpath).path;
    };

    Brewer.prototype.deps = function(relpath, cb) {
      var _this = this;
      if (!this.shouldFollow(relpath)) return cb([]);
      return fs.readFile(this.fullpath(relpath), 'utf-8', function(err, data) {
        var deps;
        if ((deps = _this.source(relpath).deps(data)).length === 0) cb([]);
        return _this._recurse_deps(deps, function(files) {
          return cb(files);
        });
      });
    };

    Brewer.prototype._recurse_deps = function(filelist, cb) {
      var files, i,
        _this = this;
      i = 0;
      filelist = _.uniq(filelist);
      files = filelist.slice(0);
      return _.each(filelist, function(file) {
        return _this.deps(file, function(deps) {
          if (deps.length > 0) files.unshift.apply(files, deps);
          if (++i === filelist.length) return cb(_.uniq(files));
        });
      });
    };

    Brewer.prototype.compileAll = function(cb) {
      var cnt, src, _i, _len, _ref, _results,
        _this = this;
      cnt = 0;
      _ref = this.sources;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        src = _ref[_i];
        if (src.compileAll != null) {
          _results.push(++cnt && src.compileAll(function() {
            if (--cnt === 0) return cb();
          }));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return Brewer;

  })();

  JavascriptBrewer = (function(_super) {

    __extends(JavascriptBrewer, _super);

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

    JavascriptBrewer.prototype.compress = function(bundle, cb) {
      return (new bundles.JavascriptBundle(this, bundle)).compress(cb);
    };

    JavascriptBrewer.prototype.compressAll = function(cb) {
      var _this = this;
      if (!this.compressed) return;
      return this.compileAll(function() {
        return _.each(_this.bundles, function(bundle) {
          return _this.compress(bundle, function(pkg) {
            sys.puts("Finished compressing " + bundle + " -> " + pkg);
            return cb();
          });
        });
      });
    };

    JavascriptBrewer.prototype.package = function(bundle, cb) {
      return (new bundles.JavascriptBundle(this, bundle)).bundle(cb);
    };

    JavascriptBrewer.prototype.packageAll = function(cb) {
      var _this = this;
      return this.compileAll(function() {
        return _.each(_this.bundles, function(bundle) {
          return _this.package(bundle, function(pkg) {
            sys.puts("Finished packaging " + bundle + " -> " + pkg);
            return cb();
          });
        });
      });
    };

    return JavascriptBrewer;

  })(Brewer);

  StylesheetsBrewer = (function(_super) {

    __extends(StylesheetsBrewer, _super);

    function StylesheetsBrewer(options) {
      _.defaults(options, {
        compress: true,
        compressed_name: "<%= filename %>.min.css"
      });
      StylesheetsBrewer.__super__.constructor.call(this, options);
      this.compressed = options.compressed, this.build = options.build, this.bundles = options.bundles, this.compressed_name = options.compressed_name;
      this.compressed_name = _.template(this.compressed_name);
      if (_.isString(this.bundles)) {
        this.bundles = JSON.parse(fs.readFileSync(this.bundles));
      }
    }

    StylesheetsBrewer.prototype.compress = function(bundle, cb) {
      if (this.compressed) {
        return (new bundles.CSSBundle(this, bundle)).compress(cb);
      }
    };

    StylesheetsBrewer.prototype.compressAll = function(cb) {
      var _this = this;
      if (!this.compressed) return;
      return _.each(this.bundles, function(bundle) {
        return _this.compress(bundle, function(pkg) {
          sys.puts("Finished compressing " + bundle + " -> " + pkg);
          return cb();
        });
      });
    };

    StylesheetsBrewer.prototype.package = function(bundle, cb) {
      return (new bundles.CSSBundle(this, bundle)).bundle(cb);
    };

    StylesheetsBrewer.prototype.packageAll = function(cb) {
      var _this = this;
      return _.each(this.bundles, function(bundle) {
        return _this.package(bundle, function(pkg) {
          sys.puts("Finished packaging " + bundle + " -> " + pkg);
          return cb();
        });
      });
    };

    return StylesheetsBrewer;

  })(Brewer);

  SassBrewer = (function(_super) {

    __extends(SassBrewer, _super);

    function SassBrewer() {
      SassBrewer.__super__.constructor.apply(this, arguments);
    }

    SassBrewer.prototype.package = function(bundle, cb) {
      return (new bundles.SassBundle(this, bundle)).bundle(cb);
    };

    SassBrewer.prototype.packageAll = function(cb) {
      var _this = this;
      if (bundles.length === 0) bundles = this.bundles;
      return _.each(bundles, function(bundle) {
        return _this.package(bundle, function(pkg) {
          sys.puts("Finished packaging " + bundle + " -> " + pkg);
          return cb();
        });
      });
    };

    return SassBrewer;

  })(StylesheetsBrewer);

  this.Brewer = Brewer = {
    create: function(options) {
      return new this[options.type](options);
    },
    javascript: JavascriptBrewer,
    js: JavascriptBrewer,
    sass: SassBrewer
  };

  this.Source = Source = {
    create: function(options) {
      return new this[options.type](options);
    },
    javascript: sources.JavascriptSource,
    js: sources.JavascriptSource,
    coffeescript: sources.CoffeescriptSource,
    cs: sources.CoffeescriptSource,
    sass: sources.SassSource
  };

}).call(this);
