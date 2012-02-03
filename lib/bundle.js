(function() {
  var Bundle, finished, fs, path, util,
    __slice = Array.prototype.slice;

  path = require('path');

  util = require('./util');

  finished = require('./command').finished;

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

    Bundle.prototype.sourcePaths = function() {
      var i, _ref, _results;
      _results = [];
      for (i = 0, _ref = this.files.length; 0 <= _ref ? i <= _ref : i >= _ref; 0 <= _ref ? i++ : i--) {
        _results.push(this.sourcePath(i));
      }
      return _results;
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
      var buildPath,
        _this = this;
      util.makedirs(path.dirname((buildPath = this.buildPath())));
      return this.brewer.deps(this.file, function(files) {
        _this.files = files;
        return util.newest.apply(util, [buildPath].concat(__slice.call(_this.sourcePaths()), [function(newest) {
          if (newest) {
            finished('Unchanged', buildPath);
            return cb(buildPath);
          } else {
            _this.stream = '';
            return _this.readFile(0, function(data) {
              return _this.convert(data, function(newdata) {
                return fs.writeFile(buildPath, newdata, 'utf-8', function() {
                  finished('Packaged', buildPath);
                  return cb(buildPath);
                });
              });
            });
          }
        }]));
      });
    };

    Bundle.prototype.convert = function(data, cb) {
      return cb(data);
    };

    return Bundle;

  })();

}).call(this);
