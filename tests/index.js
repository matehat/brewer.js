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
    var keys = _.without(_.keys(tests), 'setup', 'clean');
    if (tests.setup !== undefined) tests.setup();
    (next = function() {
      if (i < keys.length)
        console.log(color("Testing", "green"), color(key = keys.shift(), 'underline')) || tests[key](next);
      else{
        if (tests.clean !== undefined) tests.clean();
        cb();
      }
    })();
  }
}

exports.OK = function(msg) { console.log(color("  ✔", "green"), msg); };

runTests([
  require('./brewfile').tests,
  require('./js').tests,
  require('./css').tests
]);