(function() {
  var file, _i, _len, _ref;

  this.Brewer = require('./brewer').Brewer;

  this.Source = require('./source').Source;

  _ref = (require('fs')).readdirSync((require('path')).resolve(__dirname, './plugins'));
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    file = _ref[_i];
    if (file[0] !== '.') require('./plugins/' + file);
  }

}).call(this);
