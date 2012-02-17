(function() {
  var CoffeescriptSource, Source, debug, finished, showError, _ref,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  _ref = require('../command'), debug = _ref.debug, finished = _ref.finished, showError = _ref.showError;

  Source = require('../source').Source;

  CoffeescriptSource = (function(_super) {

    __extends(CoffeescriptSource, _super);

    CoffeescriptSource.type = 'icedcoffeescript';

    CoffeescriptSource.aliases = ['iced-coffee-script', 'ics'];

    CoffeescriptSource.header = /^#\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m;

    CoffeescriptSource.ext = '.iced';

    CoffeescriptSource.prototype.requiredModules = function() {
      return ['iced-coffee-script'];
    };

    function CoffeescriptSource(options) {
      CoffeescriptSource.__super__.constructor.apply(this, arguments);
      (require('underscore')).defaults(options, {
        runtime: 'window'
      });
      this.runtime = options.runtime;
    }

    CoffeescriptSource.prototype.compile = function(original, compiled, cb) {
      var compile,
        _this = this;
      compile = function(data, cb2) {
        var ndata;
        try {
          ndata = (require('iced-coffee-script')).compile(data, {
            runtime: _this.runtime
          });
          return cb2(null, ndata);
        } catch (err) {
          showError('in', original.fullpath, ':', err.message);
          return cb();
        }
      };
      return original.project(compiled, compile, function(err) {
        if (err) cb(err);
        finished('Compiled', original.fullpath);
        return cb();
      });
    };

    return CoffeescriptSource;

  })(Source.coffeescript);

  Source.extend(CoffeescriptSource);

}).call(this);
