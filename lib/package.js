(function() {
  var EventEmitter, File, Package, Source, debug, fs, info, path, sys, util, _, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __slice = Array.prototype.slice,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  path = require('path');

  sys = require('util');

  util = require('./util');

  fs = require('fs');

  _ = require('underscore');

  EventEmitter = require('events').EventEmitter;

  Source = require('./source').Source;

  File = require('./file').File;

  _ref = require('./command'), debug = _ref.debug, info = _ref.info;

  Package = (function(_super) {

    __extends(Package, _super);

    Package.registry = {};

    Package.extend = function() {
      var alias, package, packages, _i, _len, _results;
      packages = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_i = 0, _len = packages.length; _i < _len; _i++) {
        package = packages[_i];
        this.registry[package.type] = package;
        _results.push((function() {
          var _j, _len2, _ref2, _ref3, _results2;
          _ref3 = (_ref2 = package.aliases) != null ? _ref2 : [];
          _results2 = [];
          for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
            alias = _ref3[_j];
            _results2.push(this.registry[alias] = package);
          }
          return _results2;
        }).call(this));
      }
      return _results;
    };

    Package.create = function(options, sources, vendor) {
      var typ;
      if ((typ = this.registry[options.type]) == null) {
        throw "Package type " + options.type + " not known";
      }
      return new typ(options, sources, vendor);
    };

    function Package(options, sources, vendorlibs) {
      var bundles, src, _i, _len, _ref2,
        _this = this;
      this.options = options;
      this.vendorlibs = vendorlibs;
      _ref2 = this.options, this.name = _ref2.name, bundles = _ref2.bundles;
      this.files = {};
      this.sources = {};
      this._ready = false;
      this._pendingSources = 0;
      this.on('ready', function() {
        return _this._ready = true;
      });
      for (_i = 0, _len = sources.length; _i < _len; _i++) {
        src = sources[_i];
        this.registerSource(Source.create(src, this));
      }
      this.bundlePaths = _.isString(bundles) ? JSON.parse(fs.readFileSync(bundles)) : bundles;
    }

    Package.prototype.ready = function(cb) {
      if (this._ready) {
        return cb();
      } else {
        return this.on('ready', cb);
      }
    };

    Package.prototype.file = function(relpath, type, fullpath, src) {
      var file, _base, _files;
      if ((_base = this.files)[type] == null) _base[type] = {};
      file = (_files = this.files[type])[relpath];
      if (file == null) file = _files[relpath] = new File(relpath, type, this);
      if (fullpath != null) file.attach(fullpath, src);
      return file;
    };

    Package.prototype.actualize = function(cb) {
      var _this = this;
      return this.ready(function() {
        var allFiles, file, files, i, iter, leaves, relpath, type, _ref2;
        allFiles = [];
        _ref2 = _this.files;
        for (type in _ref2) {
          files = _ref2[type];
          for (relpath in files) {
            file = files[relpath];
            allFiles.push(file);
          }
        }
        leaves = _.filter(allFiles, function(file) {
          return file.liabilities.length === 0;
        });
        i = 0;
        return (iter = function() {
          return leaves[i].actualize(function() {
            if (++i < leaves.length) {
              return iter();
            } else {
              return cb();
            }
          });
        })();
      });
    };

    Package.prototype.bundle = function(imported, bundle, cb) {
      var file, output, parent, _i, _len, _ref2;
      output = '';
      parent = bundle.parent;
      _ref2 = parent.tsortedImports();
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        file = _ref2[_i];
        output += file.readSync();
      }
      output += parent.readSync();
      return bundle.write(output, cb);
    };

    Package.prototype.registerSource = function(src) {
      var _base, _name, _ref2,
        _this = this;
      ((_ref2 = (_base = this.sources)[_name = src.constructor.type]) != null ? _ref2 : _base[_name] = []).push(src);
      this._pendingSources++;
      return src.files(null, function(files) {
        if (--_this._pendingSources === 0) return _this.emit('ready');
      });
    };

    Package.prototype.clean = function() {
      var file, _i, _len, _ref2, _results;
      _ref2 = this.impermanents();
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        file = _ref2[_i];
        _results.push(file.unlinkSync());
      }
      return _results;
    };

    Package.prototype.impermanents = function() {
      var acc, file, files, type, _i, _len, _ref2, _ref3;
      acc = [];
      _ref2 = this.files;
      for (type in _ref2) {
        files = _ref2[type];
        _ref3 = _.values(files);
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          file = _ref3[_i];
          if (file.impermanent === true) acc.push(file);
        }
      }
      return acc;
    };

    Package.prototype.registerFile = function(file) {
      var bundle, compressed, fpath, type, _ref2;
      type = this.constructor.type;
      if ((_ref2 = (fpath = file.relpath), __indexOf.call(this.bundlePaths, _ref2) >= 0) && file.type === type) {
        bundle = this.file(fpath, "" + type + "-bundle", this.bundlePath(file));
        bundle.dependOnImports(file, _.bind(this.bundle, this));
        bundle.impermanent = true;
        bundle.parent = file;
        bundle.register();
        if (this.compress) {
          compressed = this.file(fpath, "" + type + "-bundle-minified", this.compressedPath(file));
          compressed.dependOn(bundle, _.bind(this.compressFile, this));
          compressed.impermanent = true;
          return compressed.register();
        }
      }
    };

    return Package;

  })(EventEmitter);

  exports.Package = Package;

}).call(this);
