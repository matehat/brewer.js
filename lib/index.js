(function() {
  var file, _i, _len, _ref;

  this.Package = require('./package').Package;

  this.Project = require('./project').Project;

  this.Source = require('./source').Source;

  this.Bundle = require('./bundle').Bundle;

  _ref = (require('fs')).readdirSync((require('path')).resolve(__dirname, './plugins'));
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    file = _ref[_i];
    if (file[0] !== '.') require('./plugins/' + file);
  }

  this.brewfile = require('./brewfile').readBrewfile;

}).call(this);
