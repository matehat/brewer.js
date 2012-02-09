util = require '../util'
fs = require 'fs'
path = require 'path'
_ = require 'underscore'
{Source} = require '..'
{finished, debug} = require '../command'
{StylesheetsPackage, StylesheetsSource} = require './css'

class StylusSource extends StylesheetsSource
  @types = ['stylus', 'styl']
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
    cpath = util.changeext (path = original.relpath), '.css'
    compiled = new File path, path.join(@output, cpath), 'stylesheets', @
    compiled.dependOn original, _.bind @compile, @
    compiled.setImportedPaths original.readImportedPaths
    @package.registerFile compiled
    compiled
  
  compile: (original, compiled, cb) ->
    parser = require('stylus')
    parser.set 'filename', @file
    parser.set 'paths', (src.path for src in @package.sources.stylus)
    
    for mod in @package.vendor.dirs 'stylus'
      module = require path.resolve mod
      styl.use(module()) if _.isFunction module
    
    compile: (data, cb) ->
      parser(data).render (err, css) ->
        cb err if err?
        cb null, css
    
    original.transformTo compiled, compile, (err) ->
      cb err if err
      finished 'Compiled', original.fullpath
      cb()
    
  


Source.extend exports.StylusSource = StylusSource