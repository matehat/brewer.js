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
project = jspackage = jspackage2 = null

exports.tests =
  setup: ->
    process.chdir path.resolve __dirname
    project = new Project path.resolve __dirname, './Brewfile'
    project.clean()
    jspackage = project[0]
    jspackage2 = project[1]
  
  clean: -> project.clean()
  
  'Requirements': (next) ->
    assert.ok project.requiredModules().length is 3
    OK 'The project has 2 requirements'
    assert.ok project.missingModules().length is 0
    OK 'The project doesn\'t have missing required modules'
    next()
  
  'Packaging Coffeescript': (next) ->
    jspackage.actualize ->
      test = require './js/build/test'
      assert.ok test.F is 2
      OK 'test.F is 2'
      assert.ok test.A is 1
      OK 'test.A is 1'
      
      test = require './js/build/test.min'
      assert.ok test.F is 2
      OK 'test.F == 2'
      assert.ok test.A is 1
      OK 'test.A == 1'
      next()
    
  
  'Packaging Coffeescript + External Libraries': (next3) ->
    jspackage2.actualize (next) ->
      jsdom.env
        html: '<html><body></body></html>'
        src: [fs.readFileSync './js/build/test2.js']
        done: (errors, window) ->
          assert.ok(window.Backbone.VERSION == '0.9.0')
          OK('window.Backbone.VERSION == "0.9.0"')
          assert.ok(window.$('body').data('id') == 'hello')
          OK('window.$("body").data("id") == "hello"')
          next2()
        
      
      next2 = ->
        jsdom.env
          html: '<html><body></body></html>'
          src: [fs.readFileSync './js/build/test2.min.js']
          done: (errors, window) ->
            assert.ok window.Backbone.VERSION is '0.9.0'
            OK('window.Backbone.VERSION == "0.9.0"')
            assert.ok window.$('body').data('id') is 'hello'
            OK('window.$("body").data("id") == "hello"')
            next3()
          
        
      
  'Packaging IcedCoffeescript': (next) ->
      jsdom.env
        html: '<html><body></body></html>'
        src: [fs.readFileSync './js/iced/testics.js']
        done: (errors, window) ->
          window.tester (msg) ->
            assert.ok msg == 'Hello!'
            OK "ICS control flow correct!"
            next()
          
        
      