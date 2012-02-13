(function() {
  var Catalog, EventEmitter, Formula, Installer, InvalidChecksum, basename, chdir, coffeescript, crypto, debug, fs, info, join, move, request, resolve, semver, spawn, temp, validVersionSpec, vm, _, _ref, _ref2,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __slice = Array.prototype.slice;

  fs = require('fs');

  _ref = require('path'), join = _ref.join, basename = _ref.basename, resolve = _ref.resolve;

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

  validVersionSpec = function(vsn) {
    return semver.valid(vsn) || semver.validRange(vsn) || vsn === 'latest';
  };

  InvalidChecksum = (function(_super) {

    __extends(InvalidChecksum, _super);

    function InvalidChecksum(formula, url) {
      this.formula = formula;
      this.url = url;
      this.message = "Invalid checksum for " + formula.name + " (" + version + "), downloaded from " + url;
      this.name = 'InvalidChecksum';
    }

    return InvalidChecksum;

  })(Error);

  Installer = (function(_super) {

    __extends(Installer, _super);

    function Installer(formula, project, version) {
      this.formula = formula;
      this.project = project;
      this.version = version != null ? version : "latest";
    }

    Installer.prototype.context = function() {
      var _this = this;
      return {
        include: function(src, opts, cb) {
          var root, _ref3;
          if (_.isFunction(opts)) {
            _ref3 = [opts, {}], cb = _ref3[0], opts = _ref3[1];
          }
          info("Moving " + src + " into vendor folder");
          root = _this.project.vendorlibs.root;
          return (spawn('cp', ['-fpLR', src, root])).on('end', function() {
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
        },
        deflate: function(file, ext, cb) {
          var child, flag, flags, _ref3;
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
        }
      };
    };

    Installer.prototype.fetch = function(cb) {
      var formula, vsn,
        _this = this;
      formula = this.formula;
      vsn = this.version;
      return temp.mkdir(function(err, temp) {
        var checksum, download, md5, req, url, ws;
        _this.temp = temp;
        if (err) cb(new Error(err));
        chdir(tempdir);
        url = _this.formula.url(vsn);
        download = join(tempdir, vsn);
        info("Downloading " + url + " to " + download);
        req = request(url);
        ws = fs.createWriteStream(download);
        req.on('error', function(err) {
          return cb(err);
        });
        ws.on('error', function(err) {
          return cb(err);
        });
        req.pipe(ws);
        if ((checksum = _this.formula.checksum) != null) {
          md5 = crypto.createHash('md5');
          req.on('data', function(data) {
            return md5.update(data);
          });
        }
        return req.on('end', function() {
          if ((checksum != null) && checksum !== md5.digest('hex')) {
            return cb(new InvalidChecksum(formula, url));
          } else {
            return cb(null, download);
          }
        });
      });
    };

    Installer.prototype.install = function(cb) {
      var _this = this;
      return this.fetch(function(err, download) {
        if (err != null) {
          return cb(err);
        } else {
          return _this.formula.installer.call(_this.context(), download, cb);
        }
      });
    };

    return Installer;

  })(EventEmitter);

  Formula = (function() {

    Formula.formattedVersion = function(vsn) {
      var major, minor, patch, tag, v, version, _ref3, _ref4;
      if (vsn === 'latest') return vsn;
      if ((version = semver.clean(vsn)) != null) {
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

    function Formula(name) {
      this.name = name;
      this.requirements = [];
      this.optionals = [];
    }

    Formula.prototype.valid = function() {
      return (this.urls != null) && (this.installer != null);
    };

    Formula.prototype.url = function(vsn) {
      var match, urls, version, versions;
      versions = this.versions;
      urls = this.urls;
      if (this.latest && vsn === 'latest') vsn = this.latest;
      if (_.isFunction(urls)) {
        if (vsn === 'latest') vsn = 'X.X.X';
        return urls(Formula.formattedVersion(semver.maxSatisfying(versions, vsn)));
      } else {
        version = vsn === 'latest' ? 'X.X.X' : vsn;
        version = semver.maxSatisfying(versions, version);
        if (vsn === 'latest' && 'latest' in urls) {
          match = urls.latest;
        } else {
          match = _.find(urls, function(url, ver) {
            if (ver === 'latest') return false;
            return semver.satisfies(version, ver);
          });
          if (match == null) return false;
        }
        if (_.isFunction(match)) match = match(Formula.formattedVersion(version));
        return match;
      }
    };

    Formula.prototype.context = function() {
      var _this = this;
      return {
        homepage: function(homepage) {
          _this.homepage = homepage;
        },
        doc: function(doc) {
          _this.doc = doc;
        },
        install: function(installer) {
          _this.installer = installer;
        },
        latest: function(latest) {
          _this.latest = latest;
        },
        md5: function(checksum) {
          _this.checksum = checksum;
        },
        versions: function() {
          var versions, _ref3;
          versions = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          if (_this.versions == null) _this.versions = [];
          return (_ref3 = _this.versions).push.apply(_ref3, versions);
        },
        urls: function(map) {
          var value, version, _results;
          if (_.isFunction(map)) {
            return _this.urls = map;
          } else if (_.isObject(map)) {
            _results = [];
            for (version in map) {
              value = map[version];
              if (!validVersionSpec(version)) {
                throw new Error("Invalid version specifier");
              }
              if (!(_this.urls != null) || _.isFunction(_this.urls)) {
                _this.urls = {};
              }
              _results.push(_this.urls[version] = value);
            }
            return _results;
          }
        },
        require: function() {
          var formula, formulae, _i, _len, _results;
          formulae = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          _results = [];
          for (_i = 0, _len = formulae.length; _i < _len; _i++) {
            formula = formulae[_i];
            if (!_.include(_this.requirements, formula)) {
              _results.push(_this.requirements.push(formula));
            }
          }
          return _results;
        },
        optional: function() {
          var formula, formulae, _i, _len, _results;
          formulae = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          _results = [];
          for (_i = 0, _len = formulae.length; _i < _len; _i++) {
            formula = formulae[_i];
            if (!_.include(_this.optionals, formula)) {
              _results.push(_this.optionals.push(formula));
            }
          }
          return _results;
        }
      };
    };

    return Formula;

  })();

  Catalog = (function() {

    function Catalog(dirpath) {
      this.dirpath = dirpath != null ? dirpath : resolve(__dirname, '..', 'formula');
      this.path = join(dirpath, 'catalog.json');
    }

    Catalog.prototype.readFile = function() {
      return this.formulae = JSON.parse(fs.readFileSync(this.path, 'utf-8'));
    };

    Catalog.prototype.writeFile = function() {
      return fs.writeFileSync(this.path, JSON.stringify(this.formulae, null, 4), 'utf-8');
    };

    Catalog.prototype.exists = function() {
      return path.exists(this.path);
    };

    Catalog.prototype.parsedir = function(cb) {};

    return Catalog;

  })();

  _.extend(exports, {
    Installer: Installer,
    Formula: Formula,
    InvalidChecksum: InvalidChecksum,
    formulae: function(file) {
      var ctx;
      ctx = _.clone(global);
      ctx.formulae = {};
      ctx.formula = function(name, body) {
        var formula;
        ctx.formulae[name] = formula = new Formula(name);
        return body.call(formula.context());
      };
      coffeescript.eval(fs.readFileSync(file, 'utf-8'), {
        sandbox: vm.createContext(ctx),
        filename: file
      });
      return ctx.formulae;
    }
  });

}).call(this);
