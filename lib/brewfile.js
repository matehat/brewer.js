(function() {
  var Package, PackageRegistry, Source, SourceRegistry, coffeescript, configs, debug, fs, newContext, package, vm, _, _ref,
    __slice = Array.prototype.slice,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore');

  vm = require('vm');

  coffeescript = require('coffee-script');

  fs = require('fs');

  debug = require('./command').debug;

  _ref = require('../lib'), Package = _ref.Package, Source = _ref.Source;

  SourceRegistry = Source.registry;

  PackageRegistry = Package.registry;

  Source = {
    options: function(opts) {
      return _.extend(this.opts, opts);
    }
  };

  Package = {
    options: function(opts) {
      return _.extend(this.opts, opts);
    },
    bundles: function() {
      var bundles, _base;
      bundles = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if ((_base = this.opts).bundles == null) _base.bundles = [];
      return this.opts.bundles = _.union(this.opts.bundles, bundles);
    },
    source: function(path, opts, cb) {
      var src;
      src = PackageRegistry[this.opts.type]["default"];
      return this._source.call(this, src, path, opts, cb);
    },
    _source: function(type, path, opts, cb) {
      var src;
      src = Object.create(Source);
      this.srcs.push(src);
      if (_.isFunction(opts)) {
        cb = opts;
        opts = {};
      }
      if (opts == null) opts = {};
      if (opts.type == null) opts.type = type;
      opts.path = path;
      src.opts = opts;
      if (_.isFunction(cb)) return cb.call(src);
    }
  };

  _.each(_.keys(SourceRegistry), function(key) {
    return Package[key] = function(path, options, cb) {
      return Package._source.call(this, key, path, options, cb);
    };
  });

  package = function(type, name, opts, cb) {
    var pkg;
    pkg = Object.create(Package);
    this.packages.push(pkg);
    if (_.isFunction(opts)) {
      cb = opts;
      opts = {};
    }
    if (opts.type == null) opts.type = type;
    opts.name = name;
    pkg.opts = _.clone(opts);
    pkg.srcs = [];
    if (_.isFunction(cb)) return cb.call(pkg);
  };

  newContext = function() {
    var ctx, prj;
    ctx = {
      project: prj = {
        root: '.',
        packages: [],
        libs: {},
        vendorDir: './vendor'
      }
    };
    _.each(_.keys(PackageRegistry), function(key) {
      return ctx[key] = function(name, opts, cb) {
        return package.call(ctx.project, key, name, opts, cb);
      };
    });
    ctx.root = function(newRoot) {
      return prj.root = newRoot;
    };
    ctx.vendor = function(newVendorDir) {
      return prj.vendorDir = newVendorDir;
    };
    ctx.require = function(libs) {
      var key, lib, value, _i, _len, _results, _results2;
      if (_.isArray(libs)) {
        _results = [];
        for (_i = 0, _len = libs.length; _i < _len; _i++) {
          lib = libs[_i];
          if (!(lib in prj.libs)) _results.push(prj.libs[lib] = 'latest');
        }
        return _results;
      } else if (_.isString(libs)) {
        if (__indexOf.call(prj.libs, libs) < 0) return prj.libs[libs] = 'latest';
      } else if (_.isObject(libs)) {
        _results2 = [];
        for (key in libs) {
          value = libs[key];
          _results2.push(prj.libs[key] = value);
        }
        return _results2;
      }
    };
    return vm.createContext(ctx);
  };

  configs = function(file) {
    var ctx;
    coffeescript.eval(fs.readFileSync(file, 'utf-8'), {
      sandbox: ctx = newContext(),
      filename: file
    });
    return ctx.project;
  };

  this.readBrewfile = function(file) {
    return new (require('../lib')).Project(configs(file));
  };

}).call(this);
