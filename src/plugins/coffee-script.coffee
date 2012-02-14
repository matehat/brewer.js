_ = require 'underscore'
fs = require 'fs'
path = require 'path'
util = require '../util'
{debug, finished, showError} = require '../command'
{Source} = require '../source'
{File} = require '../file'
{JavascriptFile} = require './javascript'

class CoffeescriptSource extends Source
  @type = 'coffeescript'
  @aliases = ['coffee-script', 'cs']
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
    cpath = util.changeext (fpath = original.relpath), '.js'
    compiled = @package.file fpath, 'javascript', path.join(@output, cpath), @
    compiled.dependOn original, _.bind(@compile, @)
    compiled.setImportedPaths original.readImportedPaths()
    compiled.impermanent = true
    compiled.register()
    compiled
  
  compile: (original, compiled, cb) ->
    compile = (data, cb2) ->
      try
        cb2 null, (require 'coffee-script').compile data
      catch err
        showError 'in', original.fullpath, ':', err.message
        cb()
    
    original.project compiled, compile, (err) ->
      cb err if err
      finished 'Compiled', original.fullpath
      cb()
    
  


exports.CoffeescriptSource = CoffeescriptSource
Source.extend CoffeescriptSource