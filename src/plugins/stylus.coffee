util = require '../util'
fs = require 'fs'
path = require 'path'
_ = require 'underscore'
{Source} = require '..'
{finished, debug} = require '../command'
{StylesheetsPackage, StylesheetsSource} = require './css'

class StylusSource extends StylesheetsSource
  @type = 'stylus'
  @aliases = ['styl']
  @ext = '.styl'
  @header = /^\/\/\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m
  
  constructor: (options) ->
    {@output} = options
    super
  
  createFile: (path) ->
    # As soon as we create the original file, create the compiled counterpart
    # returning the original
    @createCompiledFile original = super
    original
  
  createCompiledFile: (original) ->
    cpath = util.changeext (opath = original.relpath), '.css'
    compiled = @package.file opath, 'stylesheets', path.join(@output ? './cache', cpath), @
    compiled.dependOn original, _.bind(@compile, @)
    compiled.setImportedPaths original.readImportedPaths()
    @package.registerFile compiled
    compiled
  
  compile: (original, compiled, cb) ->
    compile = (data, cb) =>
      parser = require('stylus') data
      parser.set 'filename', @file
      parser.set 'paths', (src.path for src in @package.sources.stylus)

      for mod in @package.vendorlibs.libraries 'stylus'
        module = require path.resolve mod.path
        parser.use(module()) if _.isFunction module
      
      parser.render (err, css) ->
        cb err if err?
        cb null, css
    
    original.project compiled, compile, (err) ->
      cb err if err
      finished 'Compiled', original.fullpath
      cb()
    
  

Source.extend exports.StylusSource = StylusSource