(function() {
  var __slice = Array.prototype.slice;

  this.finished = function(action, target) {
    return console.log('-', require('ansi-color').set(action, 'blue'), target);
  };

  this.debug = function() {
    var msgs;
    msgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return console.log.apply(console, ['?', require('ansi-color').set('DEBUG', 'red')].concat(__slice.call(msgs)));
  };

}).call(this);
