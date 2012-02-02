(function() {

  this.finished = function(action, target) {
    return console.log('-', require('ansi-color').set(action, 'blue'), target);
  };

}).call(this);
