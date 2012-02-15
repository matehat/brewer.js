(function() {
  var Package, Source, brewer, coffeescript, configs, debug, fs, newContext, package, vm, _,
    __slice = Array.prototype.slice,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore');

  vm = require('vm');

  fs = require('fs');

  coffeescript = require('coffee-script');

  debug = require('./command').debug;

  brewer = require('./index');

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
      return this._source.call(this, this.opts.type, path, opts, cb);
    },
    _source: function(type, path, opts, cb) {
      var src;
      src = Object.create(Source);
      if (_.isFunction(opts)) {
        cb = opts;
        opts = {};
      }
      if (opts == null) opts = {};
      if (opts.type == null) opts.type = type;
      opts.path = path;
      src.opts = opts;
      this.srcs.push(src.opts);
      if (_.isFunction(cb)) return cb.call(src);
    }
  };

  _.each(brewer.Source.types(), function(key) {
    return Package[key] = function(path, options, cb) {
      return Package._source.call(this, brewer.Source[key].type, path, options, cb);
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
        reqs: {},
        vendorDir: './vendor'
      }
    };
    _.each(brewer.Package.types(), function(key) {
      return ctx[key] = function(name, opts, cb) {
        return package.call(ctx.project, brewer.Package[key].type, name, opts, cb);
      };
    });
    ctx.root = function(newRoot) {
      return prj.root = newRoot;
    };
    ctx.vendor = function(newVendorDir) {
      return prj.vendorDir = newVendorDir;
    };
    ctx.require = function(reqs) {
      var key, req, value, _i, _len, _results, _results2;
      if (_.isArray(reqs)) {
        _results = [];
        for (_i = 0, _len = reqs.length; _i < _len; _i++) {
          req = reqs[_i];
          if (!(req in prj.reqs)) _results.push(prj.reqs[lib] = 'latest');
        }
        return _results;
      } else if (_.isString(reqs)) {
        if (__indexOf.call(prj.reqs, reqs) < 0) return prj.reqs[reqs] = 'latest';
      } else if (_.isObject(reqs)) {
        _results2 = [];
        for (key in reqs) {
          value = reqs[key];
          _results2.push(prj.reqs[key] = value);
        }
        return _results2;
      }
    };
    return vm.createContext(ctx);
  };

  this.configs = configs = function(file) {
    var ctx;
    coffeescript.eval(fs.readFileSync(file, 'utf-8'), {
      sandbox: ctx = newContext(),
      filename: file
    });
    return ctx.project;
  };

}).call(this);
