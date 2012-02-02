(function() {
  var Brewer, Source, fs, path, sys, util, _,
    __slice = Array.prototype.slice;

  path = require('path');

  sys = require('util');

  util = require('./util');

  fs = require('fs');

  _ = require('underscore');

  Source = require('./source').Source;

  this.Brewer = Brewer = (function() {

    Brewer.registry = {};

    Brewer.extend = function() {
      var brewer, brewers, type, _i, _len, _results;
      brewers = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_i = 0, _len = brewers.length; _i < _len; _i++) {
        brewer = brewers[_i];
        _results.push((function() {
          var _j, _len2, _ref, _ref2, _results2;
          _ref2 = (_ref = brewer.types) != null ? _ref : [];
          _results2 = [];
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            type = _ref2[_j];
            _results2.push(this.registry[type] = brewer);
          }
          return _results2;
        }).call(this));
      }
      return _results;
    };

    Brewer.create = function(options) {
      var typ;
      if ((typ = this.registry[options.type]) == null) {
        throw "Brewer type " + options.type + " not known";
      }
      return new typ(options);
    };

    function Brewer(options) {
      var sources, src;
      sources = options.sources, this.name = options.name;
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

    Brewer.prototype.shouldFollow = function(relpath) {
      return this.source(relpath).follow;
    };

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

    Brewer.prototype.fullPath = function(relpath) {
      return this.findFile(relpath).path;
    };

    Brewer.prototype.source = function(relpath) {
      return this.findFile(relpath).source;
    };

    Brewer.prototype.bundle = function(relpath) {
      return new (this.source(relpath).constructor.Bundle)(this, relpath);
    };

    Brewer.prototype.deps = function(relpath, cb) {
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

    Brewer.prototype.compress = function(relpath, cb) {
      return this.bundle(relpath).compress(cb);
    };

    Brewer.prototype.package = function(relpath, cb) {
      return this.bundle(relpath).bundle(cb);
    };

    Brewer.prototype.compileAll = function(cb) {
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
      cnt = srcs.length;
      _results = [];
      for (_i = 0, _len = srcs.length; _i < _len; _i++) {
        src = srcs[_i];
        _results.push(src.compileAll(function() {
          if (--cnt === 0) return cb();
        }));
      }
      return _results;
    };

    Brewer.prototype.compressAll = function(cb) {
      var _this = this;
      if (!this.compressed) return;
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

    Brewer.prototype.packageAll = function(cb) {
      var _this = this;
      return this.compileAll(function() {
        var cnt;
        cnt = _this.bundles.length;
        return _.each(_this.bundles, function(bundle) {
          return _this.package(bundle, function(pkg) {
            if (--cnt === 0) return cb();
          });
        });
      });
    };

    return Brewer;

  })();

}).call(this);
