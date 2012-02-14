(function() {
  var Command, cli, clr, fs, getLocalProject, getVersion, path, _,
    __slice = Array.prototype.slice,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Command = require('commander').Command;

  clr = require('ansi-color').set;

  fs = require('fs');

  path = require('path');

  _ = require('underscore');

  exports.version = getVersion = function() {
    var pkg;
    fs = require('fs');
    path = require('path');
    pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json')));
    return pkg.version;
  };

  getLocalProject = function() {
    return new (require('./index')).Project('./Brewfile');
  };

  cli = {
    finished: function(action, target) {
      return console.log(clr(action, 'blue'), target);
    },
    debug: function() {
      var msgs;
      msgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return console.log.apply(console, [clr('DEBUG', 'red')].concat(__slice.call(msgs)));
    },
    warning: function() {
      var msgs;
      msgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return console.log.apply(console, [clr('Warning', 'yellow')].concat(__slice.call(msgs)));
    },
    info: function() {
      var msgs;
      msgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return console.log.apply(console, [clr('Info', 'green')].concat(__slice.call(msgs)));
    },
    showError: function() {
      var msgs;
      msgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return console.log.apply(console, [clr('Error', 'red')].concat(__slice.call(msgs)));
    }
  };

  _.extend(exports, cli);

  this.run = function(argv) {
    var program;
    (program = new Command).version(getVersion()).option('-t, --template <template>', 'Specify the project template to use (default to \'lesscoffee\') when initializing.');
    program.command('init').description("Initialize " + (clr('Brewer', 'green')) + " in the current directory").action(function() {
      var content, templ, template, _ref;
      templ = (_ref = program.template) != null ? _ref : 'lesscoffee';
      template = path.join(__dirname, '..', 'templates', "" + templ + ".coffee");
      content = fs.readFileSync(template, 'utf-8');
      cli.info('Writing Brewfile');
      fs.writeFileSync('Brewfile', content, 'utf-8');
      cli.info('Making initial folder structure');
      return getLocalProject().prepare();
    });
    program.command('watch').description("Watch for modifications in source and configuration files, \nautomatically re-making when they occur.").action(function() {
      getLocalProject().watch();
      return cli.info('Watching project', process.cwd());
    });
    program.command('make [packages]*').description("Aggregate bundles from the given packages (or all)").action(function(pkgs) {
      var names, packages, pkg, project, _i, _len, _results;
      if (pkgs == null) pkgs = 'all';
      project = getLocalProject();
      if (pkgs === 'all') {
        packages = project;
      } else {
        names = pkgs.split(',');
        packages = (function() {
          var _i, _len, _ref, _results;
          _results = [];
          for (_i = 0, _len = project.length; _i < _len; _i++) {
            pkg = project[_i];
            if (_ref = pkg.name, __indexOf.call(names, _ref) >= 0) {
              _results.push(pkg);
            }
          }
          return _results;
        })();
      }
      _results = [];
      for (_i = 0, _len = packages.length; _i < _len; _i++) {
        pkg = packages[_i];
        _results.push((function(pkg) {
          return pkg.actualize(function() {
            return cli.info("Finished making " + (clr(pkg.name, 'underline')) + " package");
          });
        })(pkg));
      }
      return _results;
    });
    return program.parse(argv);
  };

}).call(this);
