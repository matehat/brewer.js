(function() {
  var EventEmitter, Source, fs, parseHeader, path, util, _,
    __slice = Array.prototype.slice;

  path = require('path');

  fs = require('fs');

  _ = require('underscore');

  util = require('./util');

  EventEmitter = require('events').EventEmitter;

  this.Source = Source = (function() {

    Source.registry = {};

    Source.extend = function() {
      var sources, src, type, _i, _len, _results;
      sources = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_i = 0, _len = sources.length; _i < _len; _i++) {
        src = sources[_i];
        _results.push((function() {
          var _j, _len2, _ref, _ref2, _results2;
          _ref2 = (_ref = src.types) != null ? _ref : [];
          _results2 = [];
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            type = _ref2[_j];
            _results2.push(this.registry[type] = src);
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

    function Source(options) {
      var _ref;
      this.options = options;
      _.defaults(this.options, {
        watch: false,
        follow: true
      });
      _ref = this.options, this.watch = _ref.watch, this.path = _ref.path, this.follow = _ref.follow;
    }

    Source.prototype.deps = function(data) {
      return parseHeader(this.constructor.header, data);
    };

    Source.prototype.find = function(rel) {
      var fullPath;
      rel = util.changeExtension(rel, this.constructor.ext);
      fullPath = path.join(this.path, rel);
      if (path.existsSync(fullPath)) {
        return fullPath;
      } else {
        return false;
      }
    };

    Source.prototype.compileAll = function(cb) {
      var list,
        _this = this;
      if (this.compileFile == null) return cb();
      list = [];
      return this.listFiles(function(path) {
        list.push(path);
        return _this.compileFile(path, function() {
          list = _.without(list, path);
          if (list.length === 0 && (cb != null)) return cb();
        });
      });
    };

    Source.prototype.listFiles = function(yield) {
      var filelist, walk, walker,
        _this = this;
      walk = require('walker');
      filelist = [];
      walker = new walk(this.path, {
        followLinks: true
      });
      return walker.on('file', function(root, stat) {
        var fpath;
        fpath = path.join(root.slice(path.join(_this.path, '').length), stat.name);
        if (!_this.test(fpath)) return;
        return yield(fpath);
      });
    };

    return Source;

  })();

  parseHeader = function(regexp, data) {
    var json, recurse;
    recurse = function(_data) {
      var match;
      if ((match = _data.match(regexp)) == null) return '';
      return match[1] + recurse(_data.slice(match[0].length + match.index));
    };
    if ((json = recurse(data)).length > 0) {
      return JSON.parse(json);
    } else {
      return [];
    }
  };

}).call(this);
