(function() {
  var Project, VendorLibraries, debug, finished, fs, info, path, testModule, warning, _, _ref;

  _ = require('underscore');

  path = require('path');

  fs = require('fs');

  _ref = require('./command'), debug = _ref.debug, warning = _ref.warning, info = _ref.info, finished = _ref.finished;

  testModule = function(mod) {
    try {
      return require(mod);
    } catch (err) {
      return err.message.indexOf('Cannot find module') === -1;
    }
  };

  Project = (function() {

    function Project(file) {
      this.file = file;
      this.setup();
    }

    Project.prototype.setup = function() {
      var configs, packages, reqs, vendorDir,
        _this = this;
      configs = (require('./brewfile')).configs(this.file);
      _.defaults(configs, {
        root: '.',
        reqs: [],
        packages: [],
        vendorDir: './vendor'
      });
      this.root = configs.root, reqs = configs.reqs, packages = configs.packages, vendorDir = configs.vendorDir;
      this.vendorlibs = new VendorLibraries(this, vendorDir, reqs);
      this.length = packages.length;
      return _.each(packages, function(pkg, i) {
        return _this[i] = (require('./package')).Package.create(pkg.opts, pkg.srcs, _this.vendorlibs);
      });
    };

    Project.prototype.clean = function() {
      var pkg, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = this.length; _i < _len; _i++) {
        pkg = this[_i];
        _results.push(typeof pkg.clean === "function" ? pkg.clean() : void 0);
      }
      return _results;
    };

    Project.prototype.prepare = function() {
      var pkg, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = this.length; _i < _len; _i++) {
        pkg = this[_i];
        _results.push(typeof pkg.prepare === "function" ? pkg.prepare() : void 0);
      }
      return _results;
    };

    Project.prototype.missingModules = function() {
      return _.reject(this.requiredModules(), testModule);
    };

    Project.prototype.requiredModules = function() {
      return _.chain(this).invoke('requiredModules').flatten().uniq().value();
    };

    Project.prototype.installMissingModules = function(cb) {
      var brewerdir, i, iterate, modules, spawn;
      spawn = require('child_process').spawn;
      brewerdir = path.resolve(__dirname, '..');
      modules = this.missingModules();
      i = 0;
      iterate = function() {
        var mod, npm;
        if (i === modules.length) {
          if (cb != null) cb();
          return;
        }
        mod = modules[i++];
        info('Installing', mod);
        npm = spawn('npm', ['install', mod], {
          cwd: brewerdir
        });
        npm.stdout.pipe(process.stdout);
        npm.stderr.pipe(process.stderr);
        return npm.on('exit', function() {
          finished('installed', mod);
          return iterate();
        });
      };
      return iterate();
    };

    Project.prototype.watch = function() {
      var pkg, _i, _len,
        _this = this;
      for (_i = 0, _len = this.length; _i < _len; _i++) {
        pkg = this[_i];
        pkg.watch(_.bind(this.reset, this));
      }
      this.configWatcher = fs.watch(this.file, function(event) {
        return _this.reset();
      });
      return this.configWatcher.on('error', _.bind(this.reset, this));
    };

    Project.prototype.reset = function(err) {
      var i, pkg, _len, _ref2;
      if (err != null) throw err;
      if ((_ref2 = this.configWatcher) != null) _ref2.close();
      for (i = 0, _len = this.length; i < _len; i++) {
        pkg = this[i];
        pkg.unwatch();
        delete this[i];
      }
      delete this.length;
      delete this.vendorlibs;
      this.setup();
      return this.watch();
    };

    return Project;

  })();

  VendorLibraries = (function() {

    function VendorLibraries(project, vendorDir, requirements) {
      this.project = project;
      this.requirements = requirements;
      this.root = path.join(this.project.root, vendorDir);
      (require('./util')).makedirs(this.root);
      this.libs = this.read();
    }

    VendorLibraries.prototype.stateFile = function() {
      return path.join(this.root, 'libraries.json');
    };

    VendorLibraries.prototype.read = function() {
      var stateFile;
      if (path.existsSync(stateFile = this.stateFile())) {
        return JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      } else {
        return {};
      }
    };

    VendorLibraries.prototype.write = function() {
      return fs.writeFileSync(this.stateFile(), JSON.stringify(this.libs), 'utf-8');
    };

    VendorLibraries.prototype.libraries = function(type) {
      var dir, dpath, lib, libs, name, _lib, _ref2, _ref3;
      libs = [];
      _ref2 = this.libs;
      for (name in _ref2) {
        lib = _ref2[name];
        _ref3 = lib.content;
        for (dpath in _ref3) {
          dir = _ref3[dpath];
          if (!(dir.type === type)) continue;
          _lib = {
            path: path.join(this.root, name, dpath)
          };
          _.extend(_lib, dir);
          libs.push(_lib);
        }
      }
      return libs;
    };

    return VendorLibraries;

  })();

  exports.Project = Project;

}).call(this);
