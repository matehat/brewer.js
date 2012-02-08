(function() {
  var Package, Project, VendorLibraries, debug, fs, path, util, warning, _, _ref;

  _ = require('underscore');

  path = require('path');

  fs = require('fs');

  Package = require('../lib').Package;

  _ref = require('./command'), debug = _ref.debug, warning = _ref.warning;

  util = require('./util');

  this.Project = Project = (function() {

    Project.fromBrewfile = function(file) {
      return (require('./brewfile')).readBrewfile(file);
    };

    function Project(opts) {
      var packages, reqs, vendorDir,
        _this = this;
      _.defaults(opts, {
        root: '.',
        reqs: [],
        packages: [],
        vendorDir: './vendor'
      });
      this.root = opts.root, reqs = opts.reqs, packages = opts.packages, vendorDir = opts.vendorDir;
      this.vendor = new VendorLibraries(this, vendorDir, reqs);
      _.each(packages, function(pkg, i) {
        return _this[i] = Package.create(pkg.opts, pkg.srcs, _this.vendor);
      });
    }

    return Project;

  })();

  VendorLibraries = (function() {

    function VendorLibraries(project, vendorDir, requirements) {
      this.project = project;
      this.requirements = requirements;
      this.root = path.join(this.project.root, vendorDir);
      util.makedirs(this.root);
      this.libraries = this.read();
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
      return fs.writeFileSync(this.stateFile(), JSON.stringify(this.libraries), 'utf-8');
    };

    VendorLibraries.prototype.dirs = function(type) {
      var dir, dirs, info, modname, _i, _len, _ref2, _ref3, _ref4;
      dirs = [];
      _ref2 = this.libraries;
      for (modname in _ref2) {
        info = _ref2[modname];
        _ref4 = (_ref3 = info.dirs[type]) != null ? _ref3 : [];
        for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
          dir = _ref4[_i];
          dirs.push(path.join(this.root, modname, dir));
        }
      }
      return dirs;
    };

    return VendorLibraries;

  })();

}).call(this);
