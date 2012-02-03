(function() {
  var changeext, hasext, makedirs, splitext, _,
    _this = this,
    __slice = Array.prototype.slice;

  _ = require('underscore');

  this.makedirs = makedirs = function(path) {
    var dir, dirname, existsSync, mkdirSync, resolve, _ref;
    _ref = require('path'), dirname = _ref.dirname, resolve = _ref.resolve, existsSync = _ref.existsSync;
    mkdirSync = require('fs').mkdirSync;
    path = resolve(path);
    dir = dirname(path);
    if (!existsSync(dir)) makedirs(dir);
    if (!existsSync(path)) return mkdirSync(path);
  };

  this.hasExtension = hasext = function(filename, ext) {
    var extname;
    extname = require('path').extname;
    return extname(filename) === ext;
  };

  this.changeExtension = changeext = function(filename, ext) {
    if (hasext(filename, ext)) return filename;
    return "" + (splitext(filename)[0]) + ext;
  };

  this.splitExtension = splitext = function(filename) {
    var ext, len;
    ext = (require('path')).extname(filename);
    len = filename.length;
    return [filename.slice(0, (len - ext.length)), ext];
  };

  this.newer = function(file1, file2, cb) {
    var fs, path;
    fs = require('fs');
    path = require('path');
    try {
      return path.exists(file1, function(exists) {
        if (!exists) return cb(null, false);
        return path.exists(file2, function(exists) {
          if (!exists) return cb(null, true);
          return fs.stat(file1, function(err, stats) {
            var time1;
            if (err) throw err;
            time1 = stats.mtime.getTime();
            return fs.stat(file2, function(err, stats) {
              if (err) throw err;
              return cb(null, time1 > stats.mtime.getTime());
            });
          });
        });
      });
    } catch (err) {
      return cb(err);
    }
  };

  this.newest = function() {
    var cb, cnt, file, newest, otherFile, others, _i, _j, _len, _results;
    file = arguments[0], others = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
    cnt = others.length;
    newest = true;
    _results = [];
    for (_j = 0, _len = others.length; _j < _len; _j++) {
      otherFile = others[_j];
      _results.push((function(otherFile) {
        return _this.newer(file, otherFile, function(err, newer) {
          newest && (newest = newer);
          if (--cnt === 0) return cb(newest);
        });
      })(otherFile));
    }
    return _results;
  };

}).call(this);
