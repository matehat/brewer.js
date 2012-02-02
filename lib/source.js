(function() {
  var CoffeescriptSource, EventEmitter, JavascriptSource, SassSource, Source, StylesheetsSource, fs, parseHeader, path, util, _,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  path = require('path');

  fs = require('fs');

  _ = require('underscore');

  util = require('./util');

  EventEmitter = require('events').EventEmitter;

  Source = (function(_super) {

    __extends(Source, _super);

    function Source(options) {
      _.defaults(options, {
        watch: false
      });
      this.watch = options.watch, this.path = options.path;
    }

    Source.prototype.deps = function(data) {
      return parseHeader(this.headerRE, data);
    };

    Source.prototype.find = function(rel) {
      var fullpath;
      rel = util.changeExtension(rel, this.ext);
      fullpath = path.join(this.path, rel);
      if (path.existsSync(fullpath)) {
        return fullpath;
      } else {
        return false;
      }
    };

    Source.prototype.compileAll = function(cb) {
      var list,
        _this = this;
      if (this.compileFile == null) return cb();
      list = [];
      return this.listFiles(function(cfpath) {
        list.push(cfpath);
        return _this.compileFile(cfpath, function() {
          list = _.without(list, cfpath);
          if (list.length === 0 && (cb != null)) return cb();
        });
      });
    };

    Source.prototype.listFiles = function(yield) {
      var filelist, walk, walker,
        _this = this;
      walk = require('walker');
      filelist = [];
      walker = new walk(this.path, {
        followLinks: true
      });
      return walker.on('file', function(root, stat) {
        var fpath;
        fpath = path.resolve(root, stat.name);
        if (!_this.test(fpath)) return;
        return yield(fpath);
      });
    };

    return Source;

  })(EventEmitter);

  this.JavascriptSource = JavascriptSource = (function(_super) {

    __extends(JavascriptSource, _super);

    function JavascriptSource(options) {
      _.defaults(options, {
        follow: true
      });
      JavascriptSource.__super__.constructor.call(this, options);
      this.follow = options.follow;
      this.ext = '.js';
      this.headerRE = /^\/\/require\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/]+)/;
      this.js_path = this.path;
    }

    return JavascriptSource;

  })(Source);

  this.CoffeescriptSource = CoffeescriptSource = (function(_super) {

    __extends(CoffeescriptSource, _super);

    function CoffeescriptSource(options) {
      if (options.output == null) {
        throw "Coffeescript source needs a 'output' options";
      }
      _.defaults(options, {
        follow: true
      });
      this.follow = options.follow, this.output = options.output;
      this.ext = '.coffee';
      this.js_path = this.output;
      this.headerRE = /^#require\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/;
      CoffeescriptSource.__super__.constructor.call(this, options);
    }

    CoffeescriptSource.prototype.test = function(path) {
      return util.hasExtension(path, '.coffee');
    };

    CoffeescriptSource.prototype.compileFile = function(cfpath, next) {
      var coffee,
        _this = this;
      coffee = require('coffee-script');
      return fs.readFile(cfpath, 'utf-8', function(err, cf) {
        var jspath;
        jspath = cfpath.replace(path.resolve(_this.path), path.resolve(_this.output));
        jspath = util.changeExtension(jspath, '.js');
        util.makedirs(path.dirname(jspath));
        return fs.writeFile(jspath, coffee.compile(cf), 'utf-8', function(err) {
          if (err) throw err;
          console.log("Compiled " + (cfpath.replace(_this.path, '')) + " -> " + (jspath.replace(_this.output, '')));
          return next();
        });
      });
    };

    return CoffeescriptSource;

  })(Source);

  this.StylesheetsSource = StylesheetsSource = (function(_super) {

    __extends(StylesheetsSource, _super);

    function StylesheetsSource(options) {
      StylesheetsSource.__super__.constructor.call(this, options);
      this.ext = '.css';
      this.css_path = this.path;
      this.headerRE = /^\/\*require\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)\*\//;
    }

    StylesheetsSource.prototype.test = function(path) {
      return util.hasExtension(path, '.css');
    };

    return StylesheetsSource;

  })(Source);

  this.SassSource = SassSource = (function(_super) {

    __extends(SassSource, _super);

    function SassSource(options) {
      SassSource.__super__.constructor.call(this, options);
      this.ext = '.sass';
      this.headerRE = /^\/\/require\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/;
      this.css_path = this.path;
    }

    SassSource.prototype.find = function(rel) {
      var fullpath;
      if ((fullpath = SassSource.__super__.find.call(this, rel)) !== false) {
        return fullpath;
      }
      rel = util.changeExtension(rel, this.ext);
      fullpath = path.join(this.path, rel);
      fullpath = path.join(path.dirname(fullpath), "_" + (basename(fullpath)));
      if (path.existsSync(fullpath)) {
        return fullpath;
      } else {
        return false;
      }
    };

    SassSource.prototype.test = function(path) {
      return path.basename(path)[0] !== '_' && path.extname(path) === '.sass';
    };

    return SassSource;

  })(StylesheetsSource);

  parseHeader = function(regexp, data) {
    var json, recurse;
    recurse = function(_data) {
      var match;
      if ((match = _data.match(regexp)) == null) return '';
      return match[1] + recurse(_data.slice(match[0].length + match.index));
    };
    if ((json = recurse(data)).length > 0) {
      return JSON.parse(json);
    } else {
      return [];
    }
  };

}).call(this);
