(function() {
  var EventEmitter, Formula, Installer, basename, chdir, coffeescript, crypto, debug, fs, info, join, move, request, semver, spawn, temp, vm, _, _ref, _ref2,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __slice = Array.prototype.slice;

  fs = require('fs');

  _ref = require('path'), join = _ref.join, basename = _ref.basename;

  crypto = require('crypto');

  vm = require('vm');

  spawn = require('child_process').spawn;

  EventEmitter = require('events').EventEmitter;

  temp = require('temp');

  semver = require('semver');

  request = require('request');

  _ = require('underscore');

  coffeescript = require('coffee-script');

  chdir = process.chdir;

  _ref2 = require('./command'), info = _ref2.info, debug = _ref2.debug;

  move = fs.renameSync;

  Installer = (function(_super) {
    var _formattedVersion;

    __extends(Installer, _super);

    function Installer(formula, root, version) {
      this.formula = formula;
      this.root = root;
      this.version = version != null ? version : "latest";
    }

    Installer.prototype.include = function(src, opts, cb) {
      var root, _ref3;
      if (_.isFunction(opts)) _ref3 = [opts, {}], cb = _ref3[0], opts = _ref3[1];
      info("Moving " + src + " into vendor folder");
      return (spawn('cp', ['-fpLR', src, (root = this.root)])).on('end', function() {
        var d, dest;
        if ((dest = opts.rename) != null) {
          move.apply(null, (function() {
            var _i, _len, _ref4, _results;
            _ref4 = [basename(src), dest];
            _results = [];
            for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
              d = _ref4[_i];
              _results.push(join(root, d));
            }
            return _results;
          })());
        }
        return cb.call(this);
      });
    };

    Installer.prototype.deflate = function(file, ext, cb) {
      var child, flag, flags, _ref3,
        _this = this;
      flags = _.reject(ext.split('.'), function(f) {
        return f === '';
      });
      if (flags[0] === 'tar') {
        flag = (_ref3 = {
          'bz2': 'j',
          'gz': 'z'
        }[flags[1]]) != null ? _ref3 : '';
        child = spawn('tar', ['-xvf' + flag, file]);
      } else if (flags[0] === 'zip') {
        child = spawn('unzip', [file]);
      } else {
        return cb;
      }
      info("Deflating " + file);
      return child.on('end', function() {
        return fs.unlink(file, function() {
          return fs.readdir('.', function(err, files) {
            if (files.length === 1 && fs.statSync(files[0]).isDirectory()) {
              chdir(files[0]);
            }
            return cb.call(_this);
          });
        });
      });
    };

    _formattedVersion = function() {
      var major, minor, patch, tag, v, version, _ref3, _ref4;
      if (vsn === 'latest') return vsn;
      if ((version = semver.clean(vsn)) == null) {
        _ref3 = version.split('-'), v = _ref3[0], tag = _ref3[1];
        _ref4 = v.split('.'), major = _ref4[0], minor = _ref4[1], patch = _ref4[2];
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

    Installer.prototype._getUrl = function() {
      var match, urls, versions, vsn;
      if (_.isFunction((urls = this.formula.urlGetter))) {
        if (vsn === 'latest') {} else {
          if ((versions = this.formula.availableVersions) != null) {
            vsn = semver.maxSatisfying(versions, vsn);
          }
        }
        return urls(vsn !== 'latest' ? this._formattedVersion(vsn) : vsn);
      } else {
        if (vsn === 'latest' && !('latest' in urls)) vsn = 'X.X.X';
        if ((versions = this.formula.availableVersions) != null) {
          vsn = semver.maxSatisfying(versions, vsn);
        }
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

    Installer.prototype._fetch = function() {
      var formula,
        _this = this;
      formula = this.formula;
      return temp.mkdir(function(err, temp) {
        var download, req, url;
        _this.temp = temp;
        if (err) throw new Error(err);
        chdir(tempdir);
        req = request(url = _this._getUrl(vsn));
        info("Downloading " + url);
        req.pipe(fs.createWriteStream((download = join(tempdir, vsn))));
        return req.on('end', function() {
          return _this.formula.installer.call(_this, download);
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

    Formula.prototype.latest = function(vsn) {
      return this.latestVersion = vsn;
    };

    Formula.prototype.versions = function() {
      var versions, _ref3;
      versions = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (this.availableVersions == null) this.availableVersions = [];
      return (_ref3 = this.availableVersions).push.apply(_ref3, versions);
    };

    Formula.prototype.urls = function(map) {
      var value, version, _results;
      if (_.isFunction(map)) {
        return this.urlGetter = map;
      } else if (_.isObject(map)) {
        _results = [];
        for (version in map) {
          value = map[version];
          debug(map);
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

    return Formula;

  })();

  this.formulae = function(file) {
    var ctx;
    ctx = _.clone(global);
    ctx.formulae = [];
    ctx.formula = function(name, body) {
      var formula;
      ctx.formulae.push((formula = new Formula(name)));
      return body.call(formula);
    };
    return coffeescript.eval(fs.readFileSync(file, 'utf-8'), {
      sandbox: vm.createContext(ctx),
      filename: file
    });
  };

}).call(this);
