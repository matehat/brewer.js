(function() {
  var File, Package, Source, debug, fs, info, path, sys, util, _, _ref,
    __slice = Array.prototype.slice,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  path = require('path');

  sys = require('util');

  util = require('./util');

  fs = require('fs');

  _ = require('underscore');

  Source = require('./source').Source;

  File = require('./file').File;

  _ref = require('./command'), debug = _ref.debug, info = _ref.info;

  Package = (function() {

    Package.registry = {};

    Package.extend = function() {
      var package, packages, type, _i, _len, _results;
      packages = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_i = 0, _len = packages.length; _i < _len; _i++) {
        package = packages[_i];
        _results.push((function() {
          var _j, _len2, _ref2, _ref3, _results2;
          _ref3 = (_ref2 = package.types) != null ? _ref2 : [];
          _results2 = [];
          for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
            type = _ref3[_j];
            _results2.push(this.registry[type] = package);
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

    function Package(options, sources, vendor) {
      var src, _i, _len;
      this.options = options;
      this.vendor = vendor;
      this.name = this.options.name;
      for (_i = 0, _len = sources.length; _i < _len; _i++) {
        src = sources[_i];
        this.registerSource(Source.create(src, this));
      }
      this.files = {};
      this.sources = {};
      this.bundlePaths = _.isString(bundles) ? JSON.parse(fs.readFileSync(bundles)) : bundles;
    }

    Package.prototype.file = function(relpath, type, fullpath, src) {
      var file, _base, _files, _name, _ref2;
      _files = (_ref2 = (_base = this.files)[_name = file.type]) != null ? _ref2 : _base[_name] = {};
      if ((file = _files[relpath]) != null) return file;
      file = _files[relpath] = new File(relpath, type, this);
      if (fullpath != null) file.attach(fullpath, src);
      return file;
    };

    Package.prototype.actualize = function(cb) {
      var allFiles, files, i, iter, leaves, type;
      allFiles = _.flatten((function() {
        var _ref2, _results;
        _ref2 = this.files;
        _results = [];
        for (type in _ref2) {
          files = _ref2[type];
          _results.push(files);
        }
        return _results;
      }).call(this), true);
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
    };

    Package.prototype.bundle = function(imported, bundle, cb) {
      var file, output, _i, _len, _ref2, _results;
      output = '';
      _ref2 = bundle.tsortedImports();
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        file = _ref2[_i];
        output += file.readSync();
        _results.push(bundle.write(output, cb));
      }
      return _results;
    };

    Package.prototype.registerSource = function(src) {
      var type, _base, _i, _len, _ref2, _ref3, _results;
      _ref2 = ['all'].concat(__slice.call(src.types));
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        type = _ref2[_i];
        ((_ref3 = (_base = this.sources)[type]) != null ? _ref3 : _base[type] = []).push(src);
        _results.push(src.files());
      }
      return _results;
    };

    Package.prototype.registerFile = function(file) {
      var bundle, compressed, type, _ref2;
      type = this.constructor.types[0];
      if ((_ref2 = (path = file.relpath), __indexOf.call(this.bundlePaths, _ref2) >= 0) && file.type === type) {
        bundle = this.file(path, "" + type + "-bundle", this.bundlePath(file));
        bundle.dependOnImports(file, _.bind(this.bundle, this));
        bundle.register();
        if (this.compressed) {
          compressed = this.file(path, "" + type + "-bundle-minified", path.join(this.build, this.compressedPath(file)));
          compressed.dependOn(bundle, _.bind(this.compress, this));
          return compressed.register();
        }
      }
    };

    return Package;

  })();

  exports.Package = Package;

}).call(this);
