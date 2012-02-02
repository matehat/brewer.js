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

    Source.create = function(options) {
      var typ;
      if ((typ = this.registry[options.type]) == null) {
        throw "Source type " + options.type + " not known";
      }
      return new typ(options);
    };

    function Source(options) {
      _.defaults(options, {
        watch: false,
        follow: true
      });
      this.watch = options.watch, this.path = options.path, this.follow = options.follow;
    }

    Source.prototype.deps = function(data) {
      return parseHeader(this.headerRE, data);
    };

    Source.prototype.find = function(rel) {
      var fullpath;
      rel = util.changeExtension(rel, this.ext);
      fullpath = path.join(this.path, rel);
      if (path.existsSync(fullpath)) {
        return fullpath;
      } else {
        return false;
      }
    };

    Source.prototype.compileAll = function(cb) {
      var list,
        _this = this;
      if (this.compileFile == null) return cb();
      list = [];
      return this.listFiles(function(cfpath) {
        list.push(cfpath);
        return _this.compileFile(cfpath, function() {
          list = _.without(list, cfpath);
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
        fpath = path.resolve(root, stat.name);
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
