_ = require('underscore');
var color = require('ansi-color').set;

function runTests(tests, cb) {
  var i = 0, next;
  if (tests instanceof Array) {
    (next = function() {
      if (i < tests.length) 
        runTests(tests[i++], next) 
    })();
  } else {
    var keys = _.without(_.keys(tests), 'setup');
    if (tests.setup !== undefined) tests.setup();
    (next = function() {
      if (i < keys.length)
        console.log("+", color("Testing", "cyan"), color(key = keys.shift(), 'underline')) || tests[key](next);
      else cb();
    })();
  }
}

runTests([
  require('./js').tests,
  require('./css').tests
]);