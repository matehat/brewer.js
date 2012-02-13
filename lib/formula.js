(function() {
  var Catalog, EventEmitter, Formula, Installer, InvalidChecksum, NonSemanticVersion, basename, chdir, coffeescript, crypto, debug, exists, existsSync, fs, info, join, move, request, resolve, semver, spawn, temp, util, validVersionSpec, vm, _, _ref, _ref2,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __slice = Array.prototype.slice;

  fs = require('fs');

  _ref = require('path'), join = _ref.join, basename = _ref.basename, resolve = _ref.resolve, exists = _ref.exists, existsSync = _ref.existsSync;

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

  util = require('./util');

  move = fs.renameSync;

  validVersionSpec = function(vsn) {
    return semver.valid(vsn) || semver.validRange(vsn) || vsn === 'latest';
  };

  InvalidChecksum = (function(_super) {

    __extends(InvalidChecksum, _super);

    function InvalidChecksum(formula, version, url) {
      this.formula = formula;
      this.version = version;
      this.url = url;
      this.message = "Invalid checksum for " + formula.name + " (" + version + "), downloaded from " + url;
      this.name = 'InvalidChecksum';
    }

    return InvalidChecksum;

  })(Error);

  NonSemanticVersion = (function(_super) {

    __extends(NonSemanticVersion, _super);

    function NonSemanticVersion(version) {
      this.version = version;
      this.message = "Provided version (" + this.version + ") is not a valid semantic version (see http://semver.org)";
      this.name = "NonSemanticVersion";
    }

    return NonSemanticVersion;

  })(TypeError);

  Installer = (function() {

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

    Installer.prototype.install = function(cb) {
      var _this = this;
      return this.formula.fetch(this.version, function(err, download) {
        if (err != null) {
          return cb(err);
        } else {
          return _this.formula.installer.call(_this.context(), download, cb);
        }
      });
    };

    return Installer;

  })();

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
      this.versions = {};
    }

    Formula.prototype.valid = function() {
      return (this.urls != null) && (this.installer != null);
    };

    Formula.prototype.url = function(vsn) {
      var match, urls, version, versions;
      versions = _.keys(this.versions);
      urls = this.urls;
      if (this.latest && vsn === 'latest') vsn = this.latest;
      if (_.isFunction(urls)) {
        if (vsn === 'latest') vsn = 'X.X.X';
        vsn = (vsn != null) && versions.length > 0 ? Formula.formattedVersion(semver.maxSatisfying(versions, vsn)) : void 0;
        return urls(vsn);
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

    Formula.prototype.checksum = function(vsn) {
      var chksum;
      if ((this.versions != null) && ((chksum = this.versions[vsn]) != null)) {
        return chksum;
      } else {
        return this.md5;
      }
    };

    Formula.prototype.fetch = function(vsn, cb) {
      var checksum, dlfile, md5, req, tempdir, url, ws,
        _this = this;
      tempdir = temp.mkdirSync();
      chdir(tempdir);
      url = this.url(vsn);
      dlfile = join(tempdir, vsn);
      info("Downloading " + url + " to " + dlfile);
      req = request(url);
      ws = fs.createWriteStream(dlfile);
      req.on('error', function(err) {
        return cb(err);
      });
      ws.on('error', function(err) {
        return cb(err);
      });
      req.pipe(ws);
      if ((checksum = this.checksum(vsn)) != null) {
        md5 = crypto.createHash('md5');
        req.on('data', function(data) {
          return md5.update(data);
        });
      }
      req.on('end', function() {
        if ((checksum != null) && checksum !== md5.digest('hex')) {
          return cb(new InvalidChecksum(_this, vsn, url));
        } else {
          return cb(null, dlfile);
        }
      });
      return req;
    };

    Formula.prototype.calcsum = function(vsn, cb) {
      var dl, md5;
      md5 = crypto.createHash('md5');
      dl = this.fetch(vsn, function(err) {
        if (err != null) return cb(err);
        return cb(null, md5.digest('hex'));
      });
      dl.on('data', function(data) {
        return md5.update(data);
      });
      return null;
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
        md5: function(md5) {
          _this.md5 = md5;
        },
        versions: function() {
          var versions, vsn, _i, _len, _results;
          versions = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          if (versions.length === 1) {
            if (_this.versions == null) _this.versions = {};
            if (_.isObject(versions)) _.extend(_this.versions, versions[0]);
            if (_.isString(versions)) return _this.versions[versions] = null;
          } else if (versions.length > 1) {
            _results = [];
            for (_i = 0, _len = versions.length; _i < _len; _i++) {
              vsn = versions[_i];
              _results.push(_this.versions[vsn] = null);
            }
            return _results;
          }
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
                throw new NonSemanticVersion(version);
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
      this.path = join(this.dirpath, 'catalog.json');
      Object.defineProperty(this, 'formulae', {
        get: function() {
          if (this._formulae != null) {
            return this._formulae;
          } else {
            if (this.exists()) {
              return this._formulae = this.readFile();
            } else {
              return this.formulae = this.reload();
            }
          }
        },
        set: function(_formulae) {
          this._formulae = _formulae;
          return this.writeFile(this._formulae);
        }
      });
    }

    Catalog.prototype.readFile = function() {
      try {
        return JSON.parse(fs.readFileSync(this.path, 'utf-8'));
      } catch (err) {
        if (err instanceof SyntaxError) {
          return this.formulae = this.reload();
        } else {
          throw err;
        }
      }
    };

    Catalog.prototype.writeFile = function(formulae) {
      return fs.writeFileSync(this.path, JSON.stringify(formulae, null, 4), 'utf-8');
    };

    Catalog.prototype.exists = function() {
      return existsSync(this.path);
    };

    Catalog.prototype.get = function(name) {
      var formula;
      if ((formula = this.formulae[name]) != null) {
        return this.formulaFromFile(name, formula.file);
      } else {
        throw new Error("Formula (" + formula + ") not available");
      }
    };

    Catalog.prototype.formulaFiles = function() {
      var filelist, files, walk;
      filelist = [];
      walk = function(dpath) {
        var files;
        files = _.map(fs.readdirSync(dpath), function(p) {
          var fpath, stats;
          fpath = join(dpath, p);
          stats = fs.statSync(fpath);
          if (stats.isFile() && util.hasext(fpath, '.coffee')) {
            return [fpath];
          } else if (stats.isDirectory()) {
            return walk(fpath);
          }
        });
        return _.flatten(_.filter(files, function(file) {
          return file != null;
        }));
      };
      files = walk(this.dirpath);
      return files;
    };

    Catalog.prototype.entriesFromFile = function(file) {
      var entries,
        _this = this;
      entries = {};
      file = file.replace(this.dirpath, '').slice(1);
      _.each(this.formulaeFromFile(join(this.dirpath, file)), function(formula, name) {
        var entry, p, _i, _len, _ref3;
        entry = entries[name] = {
          file: file
        };
        _ref3 = ['name', 'homepage', 'doc', 'latest', 'md5', 'versions', 'requirements', 'optionals'];
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          p = _ref3[_i];
          entry[p] = formula[p];
        }
        return null;
      });
      return entries;
    };

    Catalog.prototype.formulaeFromFile = function(file) {
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
    };

    Catalog.prototype.formulaFromFile = function(name, file) {
      var ctx, formula;
      ctx = _.clone(global);
      formula = null;
      ctx.formula = function(_name, body) {
        if (name === _name) {
          formula = new Formula(name);
          return body.call(formula.context());
        }
      };
      coffeescript.eval(fs.readFileSync(join(this.dirpath, file), 'utf-8'), {
        sandbox: vm.createContext(ctx),
        filename: file
      });
      return formula;
    };

    Catalog.prototype.reload = function(cb) {
      var file, formulae, _formulae, _i, _len, _ref3;
      formulae = {};
      _ref3 = this.formulaFiles();
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        file = _ref3[_i];
        _formulae = this.entriesFromFile(file);
        _.extend(formulae, _formulae);
      }
      return formulae;
    };

    return Catalog;

  })();

  _.extend(exports, {
    Installer: Installer,
    Formula: Formula,
    InvalidChecksum: InvalidChecksum,
    catalog: new Catalog()
  });

}).call(this);
