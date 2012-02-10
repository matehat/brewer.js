_ = require 'underscore'
fs = require 'fs'
path = require 'path'
util = require '../util'
{Package, Source, Bundle} = require '..'
{finished, debug} = require '../command'

class StylesheetsPackage extends Package
  @types = ['stylesheets', 'css']
  @default = 'css'
  
  constructor: (options, sources, vendor) ->
    super
    _.defaults options, compress: true
    {@compress, @build, bundles} = options
    
    for lib in @vendor.dirs 'css'
      @registerSource Source.create {path: lib, type: 'css'}, @
  
  bundlePath: (file) -> 
    path.join @build, util.changeext file.relpath, '.css'
  
  compressedPath: (file) ->
    path.join @build, if @compress is true
      util.changeext file.relpath, '.min.css'
    else
      _.template(compress) filename: file.relpath
  
  compressFile: (original, dest, cb) ->
    compress = (data, cb) -> cb null, (require 'ncss') data
    original.project dest, compress, (err) ->
      cb err if err
      finished 'Compressed', original.fullpath
      cb()
  
  

  
class StylesheetsSource extends Source
  @types = ['css', 'stylesheets']
  @ext = '.css'
  @header = /^\/\*\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)\*\//m


Source.extend StylesheetsSource
Package.extend StylesheetsPackage
_.extend exports, {StylesheetsPackage, StylesheetsSource}
