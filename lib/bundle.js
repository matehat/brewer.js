(function() {
  var Bundle, fs, path, util,
    __slice = Array.prototype.slice;

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
        this._buildPath = util.changeExtension(this.basepath, (_ref = this.constructor.buildext) != null ? _ref : this.constructor.ext);
      }
      return this._buildPath;
    };

    Bundle.prototype.sourcePath = function(i) {
      return this.brewer.fullPath(i < this.files.length ? this.files[i] : this.file);
    };

    Bundle.prototype.stat = function(cb) {
      return fs.stat(this.file, cb);
    };

    Bundle.prototype.compressedStat = function(cb) {
      return fs.stat(this.compressedFile, cb);
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

    Bundle.prototype.bundle = function(cb, unchanged) {
      var _this = this;
      util.makedirs(path.dirname(this.buildPath()));
      return this.brewer.deps(this.file, function(files) {
        _this.files = files;
        return util.newest.apply(util, [_this.buildPath()].concat(__slice.call(_this.files), [function(newest) {
          if (newest) {
            return unchanged();
          } else {
            _this.stream = '';
            return _this.readFile(0, cb);
          }
        }]));
      });
    };

    return Bundle;

  })();

}).call(this);
