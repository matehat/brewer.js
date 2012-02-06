(function() {
  var Command, clr, getVersion,
    __slice = Array.prototype.slice;

  Command = require('commander').Command;

  clr = require('ansi-color').set;

  this.version = getVersion = function() {
    var fs, path, pkg;
    fs = require('fs');
    path = require('path');
    pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json')));
    return pkg.version;
  };

  this.finished = function(action, target) {
    return console.log(clr(action, 'blue'), target);
  };

  this.debug = function() {
    var msgs;
    msgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return console.log.apply(console, [clr('DEBUG', 'red')].concat(__slice.call(msgs)));
  };

  this.run = function(argv) {
    var program;
    (program = new Command).version(getVersion()).command('init').description("Initialize " + (clr('Brewer', 'green')) + " in the current directory");
    program.command('bundle [packages*]').description("Aggregate bundles from the given packages (or all)");
    program.command('compress [packages*]').description("Aggregate and compress bundles from the given packages (or all)");
    program.command("update").description("Download dependencies into a local cache");
    program.program.command('watch').description("Watch for modifications on source files, automatically\ncompiling/compressing/packaging when they occur.");
    return program.parse(argv);
  };

}).call(this);
