(function() {
  var EventEmitter, Formula, Installer, crypto, extractors, fs, request, semver, spawn, temp, vm, _,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __slice = Array.prototype.slice;

  temp = require('temp');

  fs = require('fs');

  request = require('request');

  crypto = require('crypto');

  semver = require('semver');

  _ = require('underscore');

  vm = require('vm');

  spawn = require('child_process').spawn;

  EventEmitter = require('events').EventEmitter;

  extractors = {
    'tar': function(file, flag, cb) {
      var tar;
      if (_.isFunction(flag)) {
        cb = flag;
        flag = '';
      }
      tar = spawn('tar', ['-xvf' + flag, file]);
      return tar.on('end', function() {
        return fs.unlink(file, function() {
          return fs.readdir('.', function(err, files) {
            if (files.length === 1 && fs.statSync(files[0]).isDirectory()) {
              process.chdir(files[0]);
            }
            return cb(process.cwd());
          });
        });
      });
    },
    'tar.bz2': function(file, cb) {
      return extractors['tar'](file, 'j', cb);
    },
    'tar.gz': function(file, cb) {
      return extractors['tar'](file, 'z', cb);
    },
    'zip': function(file, cb) {
      var uzip;
      uzip = spawn('unzip', [file]);
      return uzip.on('end', function() {
        return fs.unlink(file, function() {
          return fs.readdir('.', function(err, files) {
            if (files.length === 1 && fs.statSync(files[0]).isDirectory()) {
              process.chdir(files[0]);
            }
            return cb(process.cwd());
          });
        });
      });
    }
  };

  Installer = (function(_super) {
    var _formattedVersion;

    __extends(Installer, _super);

    function Installer(formula, root, version) {
      var hook, hooks, key, _i, _len, _ref,
        _this = this;
      this.formula = formula;
      if (version == null) version = "latest";
      _ref = this.formula.hooks;
      for (key in _ref) {
        hooks = _ref[key];
        for (_i = 0, _len = hooks.length; _i < _len; _i++) {
          hook = hooks[_i];
          this.on(key, hook);
        }
      }
      this.on('done', function() {
        return _this.emit('clean');
      });
    }

    Installer.prototype.include = function(src, opts, cb) {
      var cp, root;
      if (_.isFunction(opts)) {
        cb = opts;
        opts = {};
      }
      cp = spawn('cp', ['-fpLR', src, (root = this.root)]);
      return cp.on('end', function() {
        var target;
        if (opts.rename != null) {
          src = path.join(root, path.basename(src));
          target = path.join(root, opts.rename);
          return fs.rename(src, target, function() {
            return cb();
          });
        } else {
          return cb();
        }
      });
    };

    Installer.prototype.deflate = function(cb) {};

    _formattedVersion = function(vsn) {
      var major, minor, patch, tag, v, version, _ref, _ref2;
      if (vsn === 'latest') return vsn;
      if ((version = semver.clean(vsn)) == null) {
        _ref = version.split('-'), v = _ref[0], tag = _ref[1];
        _ref2 = v.split('.'), major = _ref2[0], minor = _ref2[1], patch = _ref2[2];
        return {
          tag: tag,
          major: major,
          minor: minor,
          patch: patch,
          version: version,
          toString: function() {
            return version;
          }
        };
      } else {
        throw new Error("The supplied version is not correctly formatted: '" + vsn + "'");
      }
    };

    Installer.prototype._getUrl = function(vsn) {
      var match, urls, versions;
      if (_.isFunction((urls = this.formula.urlGetter))) {
        if ((versions = this.formula.availableVersions) != null) {
          vsn = semver.maxSatisfying(versions, vsn);
        }
        return urls(vsn === 'latest' ? this._formattedVersion(vsn) : vsn);
      } else {
        if (vsn === 'latest' && !('latest' in urls)) vsn = 'X.X.X';
        if (vsn !== 'latest') {
          vsn = semver.maxSatisfying(_.without(_.keys(urls), 'latest'), vsn);
        }
        if (_.isFunction((match = urls[vsn]))) {
          return match(this._formattedVersion(vsn));
        } else {
          return match;
        }
      }
    };

    Installer.prototype._fetch = function(vsn, cb) {
      var formula,
        _this = this;
      formula = this.formula;
      return temp.mkdir(function(err, tempdir) {
        var archive, req, tStream;
        if (err) throw new Error(err);
        process.chdir(tempdir);
        archive = path.join(tempdir, "" + vsn + "." + formula.extension);
        tStream = fs.createWriteStream(archive);
        req = request(_this._getUrl(vsn)).pipe(tStream);
        return req.on('end', function() {
          var ext;
          if ((ext = formula.extension) != null) {
            return extractors[formula.extension](archive, function(dir) {
              return _this.formula.installHook(dir);
            });
          } else {
            return _this.formula.installHook(archive);
          }
        });
      });
    };

    return Installer;

  })(EventEmitter);

  Formula = (function() {

    function Formula(name) {
      this.name = name;
    }

    Formula.prototype.homepage = function(url) {
      return this.homepageURL = url;
    };

    Formula.prototype.doc = function(url) {
      return this.docURL = url;
    };

    Formula.prototype.install = function(cb) {
      return this.installer = cb;
    };

    Formula.prototype.versions = function() {
      var versions, _ref;
      versions = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (this.availableVersions == null) this.availableVersions = [];
      return (_ref = this.availableVersions).push.apply(_ref, versions);
    };

    Formula.prototype.urls = function(map) {
      var value, version, _results;
      if (_.isFunction(map)) {
        return this.urlGetter = map;
      } else if (_.isObject(map)) {
        _results = [];
        for (version in urls) {
          value = urls[version];
          if (!(version === 'latest' || semver.valid(version))) {
            throw new Error("Invalid version specifier");
          }
          if (!(this.urlGetter != null) || _.isFunction(this.urlGetter)) {
            this.urlGetter = {};
          }
          _results.push(this.urlGetter[version] = value);
        }
        return _results;
      }
    };

    Formula.prototype.compression = function(cmp) {
      if (!(cmp in extractors)) {
        throw new Error("Compression not understood: " + cmp);
      }
      return this.extension = cmp;
    };

    Formula.prototype.require = function() {
      var formula, formulae, _i, _len, _results;
      formulae = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      _results = [];
      for (_i = 0, _len = formulae.length; _i < _len; _i++) {
        formula = formulae[_i];
        if (!_.include(this.requirements, formula)) {
          _results.push(this.requirements.push(formula));
        }
      }
      return _results;
    };

    Formula.prototype.latest = function(vsn) {
      return this.latestVersion = vsn;
    };

    return Formula;

  })();

  this.formulae = function(file) {
    var ctx;
    ctx = {
      formulae: []
    };
    vm.createContext(ctx);
    coffeescript.eval(fs.readFileSync(file, 'utf-8'), {
      sandbox: ctx = newContext(),
      filename: file
    });
    return _.map(ctx.formulae, function(pkg) {});
  };

}).call(this);
