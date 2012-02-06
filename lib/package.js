(function() {
  var Package, Source, fs, path, sys, util, _,
    __slice = Array.prototype.slice;

  path = require('path');

  sys = require('util');

  util = require('./util');

  fs = require('fs');

  _ = require('underscore');

  Source = require('./source').Source;

  this.Package = Package = (function() {

    Package.registry = {};

    Package.extend = function() {
      var package, packages, type, _i, _len, _results;
      packages = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_i = 0, _len = packages.length; _i < _len; _i++) {
        package = packages[_i];
        _results.push((function() {
          var _j, _len2, _ref, _ref2, _results2;
          _ref2 = (_ref = package.types) != null ? _ref : [];
          _results2 = [];
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            type = _ref2[_j];
            _results2.push(this.registry[type] = package);
          }
          return _results2;
        }).call(this));
      }
      return _results;
    };

    Package.create = function(options, sources) {
      var typ;
      if ((typ = this.registry[options.type]) == null) {
        throw "Package type " + options.type + " not known";
      }
      return new typ(options, sources);
    };

    function Package(options, sources) {
      var src;
      this.options = options;
      this.name = this.options.name;
      this.sources = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = sources.length; _i < _len; _i++) {
          src = sources[_i];
          _results.push(Source.create(src, this));
        }
        return _results;
      }).call(this);
      this.filecache = {};
    }

    Package.prototype.shouldFollow = function(relpath) {
      return this.source(relpath).follow;
    };

    Package.prototype.findFile = function(relpath, dep) {
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

    Package.prototype.fullPath = function(relpath) {
      return this.findFile(relpath).path;
    };

    Package.prototype.source = function(relpath) {
      return this.findFile(relpath).source;
    };

    Package.prototype.bundleObj = function(relpath) {
      return new (this.source(relpath).constructor.Bundle)(this, relpath);
    };

    Package.prototype.deps = function(relpath, cb) {
      var _this = this;
      if (!this.shouldFollow(relpath)) return cb([]);
      return fs.readFile(this.fullPath(relpath), 'utf-8', function(err, data) {
        var deps;
        if ((deps = _this.source(relpath).deps(data)).length === 0) cb([]);
        return _this._recurse_deps(deps, function(files) {
          return cb(files);
        });
      });
    };

    Package.prototype._recurse_deps = function(filelist, cb) {
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

    Package.prototype.compress = function(relpath, cb) {
      return this.bundleObj(relpath).compress(cb);
    };

    Package.prototype.bundle = function(relpath, cb) {
      return this.bundleObj(relpath).bundle(cb);
    };

    Package.prototype.compileAll = function(cb) {
      var cnt, src, srcs, _i, _len, _results;
      srcs = (function() {
        var _i, _len, _ref, _results;
        _ref = this.sources;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          src = _ref[_i];
          if (src.compileAll != null) _results.push(src);
        }
        return _results;
      }).call(this);
      if ((cnt = srcs.length) === 0) cb();
      _results = [];
      for (_i = 0, _len = srcs.length; _i < _len; _i++) {
        src = srcs[_i];
        _results.push(src.compileAll(function() {
          if (--cnt === 0) return cb();
        }));
      }
      return _results;
    };

    Package.prototype.compressAll = function(cb) {
      var _this = this;
      if (!this.compressedFile) return;
      return this.compileAll(function() {
        var cnt;
        cnt = _this.bundles.length;
        return _.each(_this.bundles, function(bundle) {
          return _this.compress(bundle, function(pkg) {
            if (--cnt === 0) return cb();
          });
        });
      });
    };

    Package.prototype.bundleAll = function(cb) {
      var _this = this;
      return this.compileAll(function() {
        var cnt;
        cnt = _this.bundles.length;
        return _.each(_this.bundles, function(bundle) {
          return _this.bundle(bundle, function(pkg) {
            if (--cnt === 0) return cb();
          });
        });
      });
    };

    return Package;

  })();

}).call(this);
