_ = require 'underscore'
fs = require 'fs'
path = require 'path'
util = require '../util'
{Source} = require '../source'
{finished} = require '../command'
{JavascriptBundle} = require './javascript'

@CoffeescriptSource = class CoffeescriptSource extends Source
  @types = ['coffee-script', 'coffeescript', 'cs']
  @header = /^#\s*(?:import|require)\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m
  @ext = '.coffee'
  @buildext = '.js'
  
  @Bundle: JavascriptBundle
  
  constructor: (options) ->
    throw "Coffeescript source needs a 'output' options" unless options.output?
    _.defaults options, follow: true
    {@follow, @output} = options
    @js_path = @output
    super options
  
  test: (path) -> 
    util.hasExtension path, '.coffee'
  
  compileFile: (cfpath, next) ->
    coffee = require 'coffee-script'
    cfpath = path.join @path, cfpath
    fs.readFile cfpath, 'utf-8', (err, cf) =>
      jspath = cfpath.replace path.join(@path, '.'), path.join(@output, '.')
      jspath = util.changeExtension jspath, '.js'
      util.makedirs path.dirname jspath
      fs.writeFile jspath, coffee.compile(cf), 'utf-8', (err) =>
        throw err if err
        finished 'Compiled', cfpath
        next()
      
    
  

Source.extend CoffeescriptSource