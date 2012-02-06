(function() {
  var Package, PackageRegistry, Source, SourceRegistry, coffeescript, configs, fs, newContext, package, vm, _, _ref;

  _ = require('underscore');

  vm = require('vm');

  coffeescript = require('coffee-script');

  fs = require('fs');

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
    var ctx;
    ctx = {
      configs: {
        packages: []
      }
    };
    _.each(_.keys(PackageRegistry), function(key) {
      return ctx[key] = function(name, opts, cb) {
        return package.call(ctx.configs, key, name, opts, cb);
      };
    });
    return vm.createContext(ctx);
  };

  this.configs = configs = function(file) {
    var ctx;
    coffeescript.eval(fs.readFileSync(file, 'utf-8'), {
      sandbox: ctx = newContext(),
      filename: file
    });
    return ctx.configs.packages;
  };

  this.packages = function(file) {
    var Pkg;
    Pkg = (require('../lib')).Package;
    return _.map(configs(file), function(pkg) {
      return Pkg.create(pkg.opts, pkg.srcs);
    });
  };

}).call(this);
