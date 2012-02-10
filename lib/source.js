(function() {
  var EventEmitter, File, Source, debug, fs, path, util, _,
    __slice = Array.prototype.slice;

  path = require('path');

  fs = require('fs');

  _ = require('underscore');

  util = require('./util');

  debug = require('./command').debug;

  EventEmitter = require('events').EventEmitter;

  File = require('./file').File;

  Source = (function() {

    Source.registry = {};

    Source.extend = function() {
      var alias, sources, src, _i, _len, _results;
      sources = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_i = 0, _len = sources.length; _i < _len; _i++) {
        src = sources[_i];
        this.registry[src.type] = src;
        _results.push((function() {
          var _j, _len2, _ref, _ref2, _results2;
          _ref2 = (_ref = src.aliases) != null ? _ref : [];
          _results2 = [];
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            alias = _ref2[_j];
            _results2.push(this.registry[alias] = src);
          }
          return _results2;
        }).call(this));
      }
      return _results;
    };

    Source.create = function(options, package) {
      var typ;
      if ((typ = this.registry[options.type]) == null) {
        throw "Source type " + options.type + " not known";
      }
      return new typ(options, package);
    };

    function Source(options, package) {
      var _ref;
      this.options = options;
      this.package = package;
      _.defaults(this.options, {
        watch: false,
        follow: true
      });
      _ref = this.options, this.watch = _ref.watch, this.path = _ref.path, this.follow = _ref.follow;
    }

    Source.prototype.createFile = function(fpath) {
      var ctor, file, fullpath;
      ctor = this.constructor;
      fullpath = util.changeext(path.join(this.path, fpath), this.constructor.ext);
      file = this.package.file(fpath, ctor.type, fullpath, this);
      file.register();
      return file;
    };

    Source.prototype.test = function(path) {
      return util.hasext(path, this.constructor.ext);
    };

    Source.prototype.files = function(yield, end) {
      var each,
        _this = this;
      if (this.filelist != null) {
        if (yield != null) _.each(this.filelist, yield);
        if (end != null) return end(this.filelist);
      } else {
        this.filelist = [];
        each = function(fpath) {
          var file;
          file = _this.createFile(util.changeext(fpath, ''));
          if (yield != null) yield(file);
          return _this.filelist.push(file);
        };
        return this.list(each, function() {
          if (end != null) return end(_this.filelist);
        });
      }
    };

    Source.prototype.list = function(yield, end) {
      var filelist, rpath, walk, walker,
        _this = this;
      walk = require('walker');
      filelist = [];
      walker = new walk((rpath = path.join(this.path, '')), {
        followLinks: true
      });
      walker.on('file', function(root, stat) {
        var fpath;
        fpath = path.join(root.slice(rpath.length + 1), stat.name);
        if (!_this.test(fpath)) return;
        return yield(fpath);
      });
      return walker.on('end', end);
    };

    return Source;

  })();

  exports.Source = Source;

}).call(this);
