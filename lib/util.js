(function() {
  var changeext, debug, fs, hasext, makedirs, path, splitext, _,
    _this = this,
    __slice = Array.prototype.slice;

  _ = require('underscore');

  fs = require('fs');

  path = require('path');

  debug = require('./command').debug;

  this.checksumSync = function(path) {
    var md5;
    md5 = (require('crypto')).createHash('md5');
    md5.update(fs.readFileSync(path));
    return md5.digest('hex');
  };

  this.checksumStream = function(readStream, cb) {
    var md5;
    md5 = (require('crypto')).createHash('md5');
    readStream.on('data', function(data) {
      return md5.update(data);
    });
    return readStream.on('end', function() {
      return cb(md5.digest('hex'));
    });
  };

  this.makedirs = makedirs = function(fpath) {
    var dir;
    fpath = path.resolve(fpath);
    dir = path.dirname(fpath);
    if (!path.existsSync(dir)) makedirs(dir);
    if (!path.existsSync(fpath)) return fs.mkdirSync(fpath);
  };

  this.hasext = hasext = function(filename, ext) {
    return path.extname(filename) === ext;
  };

  this.changeext = changeext = function(filename, ext) {
    if (hasext(filename, ext)) return filename;
    return "" + (splitext(filename)[0]) + ext;
  };

  this.splitext = splitext = function(filename) {
    var ext, len;
    ext = path.extname(filename);
    len = filename.length;
    return [filename.slice(0, (len - ext.length)), ext];
  };

  this.newer = function(file1, file2, cb) {
    return path.exists(file1, function(exists) {
      if (!exists) return cb(null, false);
      return path.exists(file2, function(exists) {
        if (!exists) return cb(null, true);
        return fs.stat(file1, function(err, stats) {
          var time1;
          if (err) return cb(err);
          time1 = stats.mtime.getTime();
          return fs.stat(file2, function(err, stats) {
            var time2;
            if (err) return cb(err);
            time2 = stats.mtime.getTime();
            return cb(null, time1 > time2);
          });
        });
      });
    });
  };

  this.newerSync = function(file1, file2) {
    var time1, time2;
    if (!path.existsSync(file1)) return false;
    if (!path.existsSync(file2)) return true;
    time1 = fs.statSync(file1).mtime.getTime();
    time2 = fs.statSync(file2).mtime.getTime();
    return time1 > time2;
  };

  this.newest = function() {
    var cb, cnt, fail, file, newest, otherFile, others, _i, _j, _len, _results;
    file = arguments[0], others = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
    cnt = others.length;
    newest = true;
    fail = false;
    _results = [];
    for (_j = 0, _len = others.length; _j < _len; _j++) {
      otherFile = others[_j];
      _results.push((function(otherFile) {
        if (fail) return;
        return _this.newer(file, otherFile, function(err, newer) {
          if (fail) return;
          if (err != null) return (fail = true) && cb(err);
          newest && (newest = newer);
          if (--cnt === 0) return cb(null, newest);
        });
      })(otherFile));
    }
    return _results;
  };

  this.newestSync = function() {
    var file, newest, otherFile, others, _i, _len;
    file = arguments[0], others = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    newest = true;
    for (_i = 0, _len = others.length; _i < _len; _i++) {
      otherFile = others[_i];
      newest && (newest = _this.newer(file, otherFile));
    }
    return newest;
  };

}).call(this);
