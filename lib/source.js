(function() {
  var EventEmitter, File, Source, debug, fs, info, path, util, _, _ref,
    __slice = Array.prototype.slice,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  path = require('path');

  fs = require('fs');

  _ = require('underscore');

  util = require('./util');

  _ref = require('./command'), debug = _ref.debug, info = _ref.info;

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
          var _j, _len2, _ref2, _ref3, _results2;
          _ref3 = (_ref2 = src.aliases) != null ? _ref2 : [];
          _results2 = [];
          for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
            alias = _ref3[_j];
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
      var watch, _ref2;
      this.options = options;
      this.package = package;
      _.defaults(this.options, {
        watch: true,
        follow: true
      });
      _ref2 = this.options, watch = _ref2.watch, this.path = _ref2.path, this.follow = _ref2.follow, this.requirements = _ref2.requirements;
      this.shouldWatch = watch;
      util.makedirs(this.path);
    }

    Source.prototype.createFile = function(fpath) {
      var ctor, file, fullpath;
      ctor = this.constructor;
      fullpath = util.changeext(path.join(this.path, fpath), ctor.ext);
      file = this.package.file(fpath, ctor.type);
      file.attach(fullpath, this);
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
          var file, imports, _ref2;
          file = _this.createFile(util.changeext(fpath, ''));
          if ((imports = (_ref2 = _this.requirements) != null ? _ref2[file.relpath] : void 0) != null) {
            file.setImportedPaths(imports);
          }
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
      if (end != null) return walker.on('end', end);
    };

    Source.prototype.watch = function(reset) {
      var f, filelist,
        _this = this;
      if (!(this.shouldWatch && (this.filelist != null))) return;
      filelist = (function() {
        var _i, _len, _ref2, _results;
        _ref2 = this.filelist;
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          f = _ref2[_i];
          _results.push(f.relpath);
        }
        return _results;
      }).call(this);
      return this.watcher = fs.watch(this.path, function(event) {
        return _this.list(function(fpath) {
          fpath = util.changeext(fpath, '');
          if (__indexOf.call(filelist, fpath) < 0) {
            info(fpath, 'added');
            return reset();
          }
        });
      });
    };

    Source.prototype.unwatch = function() {
      var _ref2;
      return (_ref2 = this.watcher) != null ? _ref2.close() : void 0;
    };

    return Source;

  })();

  exports.Source = Source;

}).call(this);
