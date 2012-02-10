(function() {
  var EventEmitter, File, debug, finished, fs, path, util, _, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  path = require('path');

  util = require('./util');

  _ref = require('./command'), finished = _ref.finished, debug = _ref.debug;

  EventEmitter = require('events').EventEmitter;

  debug = require('./command').debug;

  fs = require('fs');

  _ = require('underscore');

  File = (function(_super) {

    __extends(File, _super);

    function File(relpath, type, package) {
      this.relpath = relpath;
      this.type = type;
      this.package = package;
      this.dependencies = [];
      this.liabilities = [];
    }

    File.prototype.attach = function(fullpath, source) {
      var _ref2;
      if (this.attached()) {
        if (fullpath !== this.fullpath) {
          throw new Error("File already attached to " + this.fullpath);
        }
      } else {
        _ref2 = [fullpath, source], this.fullpath = _ref2[0], this.source = _ref2[1];
        return this.emit('attach');
      }
    };

    File.prototype.register = function() {
      return this.package.registerFile(this);
    };

    File.prototype.dependOn = function(other, actualize) {
      this.dependencies.push([other, actualize]);
      return other.dependedBy(this);
    };

    File.prototype.dependedBy = function(other) {
      return this.liabilities.push(other);
    };

    File.prototype.actualize = function(cb) {
      var end, i, iter,
        _this = this;
      i = 0;
      iter = function() {
        var act, dep, _ref2;
        if (i < _this.dependencies.length) {
          _ref2 = _this.dependencies[i++], dep = _ref2[0], act = _ref2[1];
          return dep.actualize(function() {
            return iter();
          });
        } else {
          return end();
        }
      };
      end = function() {
        var act, dep, newest, _i, _len, _ref2, _ref3;
        if (_this.dependencies.length > 0) {
          newest = true;
          _ref2 = _this.dependencies;
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            _ref3 = _ref2[_i], dep = _ref3[0], act = _ref3[1];
            if (!_this.newer(dep)) {
              act(dep, _this, function(err) {
                if (err) throw new Error(err);
                return cb();
              });
              newest = false;
              break;
            }
          }
          if (newest) return cb();
        } else {
          return cb();
        }
      };
      return iter();
    };

    File.prototype.readImportedPaths = function() {
      var json, p, paths, recurse, regexp;
      if (this.source != null) {
        regexp = this.source.constructor.header;
        recurse = function(_data) {
          var match;
          if ((match = _data.match(regexp)) == null) return '';
          return match[1] + recurse(_data.slice(match[0].length + match.index));
        };
        paths = (json = recurse(this.readSync())).length > 0 ? JSON.parse(json) : [];
        return paths = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = paths.length; _i < _len; _i++) {
            p = paths[_i];
            _results.push(util.changeext(p, ''));
          }
          return _results;
        })();
      } else {
        return [];
      }
    };

    File.prototype.setImportedPaths = function(paths) {
      this._importedPaths = paths;
      return this._imports = null;
    };

    File.prototype.importedPaths = function() {
      if (this._importedPaths == null) {
        this._importedPaths = this.readImportedPaths();
      }
      return this._importedPaths;
    };

    File.prototype.imports = function() {
      var path;
      if (this._imports == null) {
        this._imports = (function() {
          var _i, _len, _ref2, _results;
          _ref2 = this.importedPaths();
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            path = _ref2[_i];
            _results.push(this.package.file(path, this.type));
          }
          return _results;
        }).call(this);
      }
      return this._imports;
    };

    File.prototype.dependOnImports = function(other, actualize) {
      var crawl, depend, imported,
        _this = this;
      imported = [];
      crawl = function(file) {
        var _file, _i, _len, _ref2, _results;
        _ref2 = file.imports();
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          _file = _ref2[_i];
          _results.push(depend(_file));
        }
        return _results;
      };
      depend = function(file) {
        var _ref2;
        if (_ref2 = file.relpath, __indexOf.call(imported, _ref2) < 0) {
          if (file.attached()) {
            crawl(file);
          } else {
            file.on('attach', function() {
              return crawl(file);
            });
          }
          _this.dependOn(file, actualize);
          return imported.push(file.relpath);
        }
      };
      return depend(other);
    };

    File.prototype.tsortedImports = function() {
      var DAG, S, buildDAG, m, n, topoSortedFiles, visited, _i, _len, _ref2;
      topoSortedFiles = [];
      DAG = {};
      visited = [];
      buildDAG = function(file) {
        var edges, n, _i, _len, _name, _ref2, _ref3, _ref4;
        if (_ref2 = file.relpath, __indexOf.call(visited, _ref2) >= 0) return;
        _ref3 = file.imports();
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          n = _ref3[_i];
          edges = (_ref4 = DAG[_name = n.relpath]) != null ? _ref4 : DAG[_name] = [];
          edges.push(file.relpath);
          buildDAG(n);
        }
        return visited.push(file.relpath);
      };
      buildDAG(this);
      S = [this];
      while (S.length > 0) {
        n = S.shift();
        topoSortedFiles.push(n);
        _ref2 = n.imports();
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          m = _ref2[_i];
          DAG[m.relpath] = _.without(DAG[m.relpath], n.relpath);
          if (DAG[m.relpath].length === 0) S.push(m);
        }
      }
      return topoSortedFiles.reverse();
    };

    File.prototype.newer = function(other) {
      return util.newerSync(this.fullpath, other.fullpath);
    };

    File.prototype.attached = function() {
      return this.fullpath != null;
    };

    File.prototype.exists = function() {
      return this.attached() && path.existsSync(this.fullpath);
    };

    File.prototype.makedirs = function() {
      return util.makedirs(path.dirname(this.fullpath));
    };

    File.prototype.read = function(cb) {
      if (!this.exists()) return;
      return fs.readFile(this.fullpath, 'utf-8', function(err, data) {
        return cb(err, data);
      });
    };

    File.prototype.readSync = function() {
      if (!this.exists()) return;
      return fs.readFileSync(this.fullpath, 'utf-8');
    };

    File.prototype.write = function(data, cb) {
      if (!this.attached()) return;
      this.makedirs();
      return fs.writeFile(this.fullpath, data, 'utf-8', cb);
    };

    File.prototype.writeSync = function(data) {
      if (!this.attached()) return;
      this.makedirs();
      return fs.writeFileSync(this.fullpath, data, 'utf-8');
    };

    File.prototype.unlinkSync = function() {
      if (!this.exists()) return;
      return fs.unlinkSync(this.fullpath);
    };

    File.prototype.project = function(dest, morph, cb) {
      return this.read(function(err, data) {
        if (err) cb(err);
        return morph(data, function(error, newdata) {
          return dest.write(newdata, cb);
        });
      });
    };

    return File;

  })(EventEmitter);

  exports.File = File;

}).call(this);
