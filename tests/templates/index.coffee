brewer = require '../..',
{debug} = require '../../lib/command'
fs = require 'fs'
path = require 'path'
sys = require 'util' 
assert = require 'assert'
_ = require 'underscore'
jsdom = require 'jsdom'
cssom = require 'cssom'
{Project} = brewer
{OK} = require '..'
color = require('ansi-color').set
project = package = null

exports.tests =
  setup: ->
    process.chdir path.resolve __dirname
    project = new Project path.resolve __dirname, './Brewfile'
    project.clean()
    package = project[0]
  
  clean: -> project.clean()
  
  'Packaging Mustache': (next) ->
    package.actualize ->
      test = require './js/test'
      assert.ok test.JST.test1 == "Hello {{who}}!"
      OK 'bundle.JST.test1 is loaded'
      
      assert.ok test.render(test.JST.test1, {who: 'world'}) == 'Hello world!'
      OK 'render(bundle.JST.test1) == "Hello world!"'
      
      next()
    
