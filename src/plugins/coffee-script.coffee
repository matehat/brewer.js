_ = require 'underscore'
fs = require 'fs'
path = require 'path'
util = require '../util'
{Source} = require '../source'
{File} = require '../file'
{finished} = require '../command'
{JavascriptFile} = require './javascript'

class CoffeescriptSource extends Source
  @types = ['coffeescript', 'coffee-script', 'cs']
  @header = /^#\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m
  @ext = '.coffee'
  
  constructor: (options, package) ->
    throw "Coffeescript source needs a 'output' options" unless options.output?
    _.defaults options, follow: true
    {@follow, @output} = options
    super
  
  createFile: (path) ->
    # As soon as we create the original file, create the compiled counterpart
    # returning the original
    @createCompiledFile original = super
    original
  
  createCompiledFile: (original) ->
    cpath = util.changeext (path = original.relpath), '.js'
    compiled = new File path, path.join(@output, cpath), 'javascript', @
    compiled.dependOn original, _.bind @compile, @
    compiled.setImportedPaths original.readImportedPaths
    @package.registerFile compiled
    compiled
  
  compile: (original, compiled, cb) ->
    compile = (data, cb) -> cb null, (require 'coffee-script').compile cf
    original.transformTo compiled, compile, (err) ->
      cb err if err
      finished 'Compiled', original.fullpath
      cb()
    
  


exports.CoffeescriptSource = CoffeescriptSource
Source.extend CoffeescriptSource