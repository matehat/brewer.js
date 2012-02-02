_ = require('underscore');

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
        console.log("=== " + (key = keys.shift()) + " ===") || tests[key](next) 
    })();
  }
}

runTests([
  require('./bundles').tests
]);