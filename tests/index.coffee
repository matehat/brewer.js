_ = require 'underscore'
color = require('ansi-color').set

runTests = (tests, cb) ->
  i = 0
  if tests instanceof Array
    next = ->
      if i < tests.length
        runTests tests[i++], next
    
    next()
  else
    keys = _.without _.keys(tests), 'setup', 'clean'
    tests.setup?() if tests.setup?
    next = ->
      if i < keys.length
        key = keys.shift()
        console.log color("Testing", "green"), color(key, 'underline')
        tests[key] next
      else
        tests.clean?()
        cb()
      
    next()


exports.OK = (msg) -> console.log color("  ✔", "green"), msg

runTests [
  require('./brewfile').tests
  require('./js').tests
  require('./css').tests
]