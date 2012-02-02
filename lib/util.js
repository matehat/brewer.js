(function() {
  var changeext, hasext, makedirs, splitext;

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

}).call(this);
