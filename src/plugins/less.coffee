util = require '../util'
fs = require 'fs'
path = require 'path'
{Source} = require '..'
{finished, debug} = require '../command'
{StylesheetsPackage, StylesheetsSource} = require './css'

class LessSource extends StylesheetsSource
  @type = 'less'
  @ext = '.less'
  @header = /^\/\/\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m
  
  constructor: (options, package) ->
    {@output} = options
    super
  
  createFile: (path) ->
    # As soon as we create the original file, create the compiled counterpart
    # returning the original
    @createCompiledFile original = super
    original
  
  createCompiledFile: (original) ->
    cpath = util.changeext (path = original.relpath), '.css'
    compiled = @package.file path, 'stylesheets', path.join(@output, cpath), @
    compiled.dependOn original, _.bind @compile, @
    compiled.setImportedPaths original.readImportedPaths
    @package.registerFile compiled
    compiled
  
  compile: (original, compiled, cb) ->
    paths = (src.path for src in @package.sources.less)
    paths.push lib for lib in @package.vendor.dirs 'less'
    
    parser = new (require('less').Parser)
      filename: @file
      paths: paths
    
    compile: (data, cb) ->
      parser.parse data, (err, tree) ->
        cb err if err?
        cb null, tree.toCSS()
    
    original.project compiled, compile, (err) ->
      cb err if err
      finished 'Compiled', original.fullpath
      cb()
    
  

Source.extend exports.LessSource = LessSource