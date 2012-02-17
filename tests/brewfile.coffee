path = require 'path'
assert = require 'assert'
{debug} = require '../lib/command'
{Project} = require '../lib'
{OK} = require '../tests'

exports.tests =
  'Parsing a Brewfile': (next) ->
    process.chdir path.resolve __dirname, 'js'
    project = new Project path.resolve __dirname, 'js/Brewfile'
    OK 'js/Brewfile parsed.'
    
    js = project[0]
    assert.ok js.options.type is 'javascript' and js.sources.coffeescript[0].options.output is './js'
    OK 'js/Brewfile correctly parsed.'
    next()
