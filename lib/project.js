(function() {
  var Package, Project, debug, _;

  _ = require('underscore');

  Package = require('../lib').Package;

  debug = require('./command').debug;

  this.Project = Project = (function() {

    Project.fromBrewfile = function(file) {
      return (require('./brewfile')).readBrewfile(file);
    };

    function Project(opts) {
      var packages,
        _this = this;
      _.defaults(opts, {
        root: '.',
        libs: [],
        packages: [],
        vendorDir: './vendor'
      });
      this.root = opts.root, this.libs = opts.libs, packages = opts.packages, this.vendorDir = opts.vendorDir;
      _.each(packages, function(pkg, i) {
        return _this[i] = Package.create(pkg.opts, pkg.srcs);
      });
    }

    return Project;

  })();

}).call(this);
