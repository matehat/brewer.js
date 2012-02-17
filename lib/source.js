(function() {
  var Source, debug, info, util, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __slice = Array.prototype.slice,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  util = require('./util');

  _ref = require('./command'), debug = _ref.debug, info = _ref.info;

  Source = (function() {

    Source.types = function() {
      var type, _results;
      _results = [];
      for (type in this) {
        if (!__hasProp.call(this, type)) continue;
        if (type !== 'types' && type !== 'extend' && type !== 'create') {
          _results.push(type);
        }
      }
      return _results;
    };

    Source.extend = function() {
      var alias, sources, src, _i, _len, _results;
      sources = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_i = 0, _len = sources.length; _i < _len; _i++) {
        src = sources[_i];
        this[src.type] = src;
        _results.push((function() {
          var _j, _len2, _ref2, _ref3, _results2;
          _ref3 = (_ref2 = src.aliases) != null ? _ref2 : [];
          _results2 = [];
          for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
            alias = _ref3[_j];
            _results2.push(this[alias] = src);
          }
          return _results2;
        }).call(this));
      }
      return _results;
    };

    Source.create = function(options, package) {
      var typ;
      if ((typ = this[options.type]) == null) {
        throw "Source type " + options.type + " not known";
      }
      return new typ(options, package);
    };

    function Source(options, package) {
      var _ref2;
      this.options = options;
      this.package = package;
      (require('underscore')).defaults(this.options, {
        watch: true,
        output: './_cache'
      });
      _ref2 = this.options, this.path = _ref2.path, this.requirements = _ref2.requirements;
      this.shouldWatch = this.options.watch;
      util.makedirs(this.path);
    }

    Source.prototype.requiredModules = function() {
      return [];
    };

    Source.prototype.createFile = function(fpath) {
      var ctor, file, fullpath, imports, _ref2;
      ctor = this.constructor;
      fullpath = util.changeext((require('path')).join(this.path, fpath), ctor.ext);
      file = this.package.file(fpath, ctor.type, fullpath, this);
      file.register();
      if ((imports = (_ref2 = this.requirements) != null ? _ref2[file.relpath] : void 0) != null) {
        file.setImportedPaths(imports);
      }
      return file;
    };

    Source.prototype.test = function(path) {
      return util.hasext(path, this.constructor.ext);
    };

    Source.prototype.list = function(yield, end) {
      var filelist, join, rpath, walk, walker,
        _this = this;
      walk = require('walker');
      join = require('path').join;
      filelist = [];
      walker = new walk((rpath = join(this.path, '')), {
        followLinks: true
      });
      walker.on('file', function(root, stat) {
        var fpath;
        fpath = join(root.slice(rpath.length + 1), stat.name);
        if (!_this.test(fpath)) return;
        return yield(fpath);
      });
      if (end != null) return walker.on('end', end);
    };

    Source.prototype.files = function(yield, list) {
      var each,
        _this = this;
      if (this.filelist != null) {
        if (yield != null) (require('underscore')).each(this.filelist, yield);
        if (list != null) return list(this.filelist);
      } else {
        this.filelist = [];
        each = function(fpath) {
          var file;
          file = _this.createFile(util.changeext(fpath, ''));
          if (yield != null) yield(file);
          return _this.filelist.push(file);
        };
        return this.list(each, function() {
          if (list != null) return list(_this.filelist);
        });
      }
    };

    Source.prototype.watch = function(reset) {
      var filelist,
        _this = this;
      if (!this.shouldWatch) return;
      filelist = null;
      return this.watcher = (require('fs')).watch(this.path, function(event) {
        var f;
        if (_this.filelist == null) return;
        if (filelist == null) {
          filelist = (function() {
            var _i, _len, _ref2, _results;
            _ref2 = this.filelist;
            _results = [];
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
              f = _ref2[_i];
              _results.push(f.relpath);
            }
            return _results;
          }).call(_this);
        }
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
