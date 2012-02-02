(function() {
  var Bundle, fs, path, util;

  path = require('path');

  util = require('./util');

  fs = require('fs');

  this.Bundle = Bundle = (function() {

    function Bundle(brewer, file) {
      this.brewer = brewer;
      this.file = file;
      this.basepath = path.join(this.brewer.build, this.file);
      this.compressedFile = this.brewer.compressedFile({
        filename: util.changeExtension(this.basepath, '')
      });
    }

    Bundle.prototype.buildPath = function() {
      var _ref;
      if (this._buildPath == null) {
        this._buildPath = util.changeExtension(this.basepath, (_ref = this.buildext) != null ? _ref : this.ext);
      }
      return this._buildPath;
    };

    Bundle.prototype.sourcePath = function(i) {
      return this.brewer.fullPath(i < this.files.length ? this.files[i] : this.file);
    };

    Bundle.prototype.readFile = function(i, cb, mod) {
      var rs,
        _this = this;
      if (mod == null) {
        mod = (function(a) {
          return a;
        });
      }
      return rs = fs.readFile(this.sourcePath(i), {
        encoding: 'utf-8'
      }, function(err, data) {
        if (err) throw err;
        _this.stream += mod(data.toString());
        return _this.nextFile(i, cb, mod);
      });
    };

    Bundle.prototype.nextFile = function(i, cb, mod) {
      if (i < this.files.length) {
        return this.readFile(i + 1, cb, mod);
      } else {
        cb(this.stream);
        return delete this.stream;
      }
    };

    Bundle.prototype.bundle = function(cb) {
      var _this = this;
      return this.brewer.deps(this.file, function(files) {
        _this.files = files;
        _this.stream = '';
        return _this.readFile(0, cb);
      });
    };

    return Bundle;

  })();

}).call(this);
