_ = require 'underscore'
fs = require 'fs'
path = require 'path'
util = require '../util'
{Package, Source, Bundle} = require '..'
{finished, debug} = require '../command'

@StylesheetsPackage = class StylesheetsPackage extends Package
  @types = ['css', 'stylesheets']
  @default = 'css'
  
  constructor: (options, sources) ->
    super options, sources
    _.defaults options, compress: true
    {compress, @build, @bundles} = options
    @bundles = JSON.parse fs.readFileSync @bundles if _.isString @bundles
    if compress
      @compressedFile = _.template if _.isString(compress) then compress else "<%= filename %>.min.css"
  

@StylesheetsBundle = class StylesheetsBundle extends Bundle
  @ext = '.css'
  
  importPath: (src, file) ->
    path.join (src.output ? src.path), util.changeExtension file, 
    ((ctor = src.constructor).buildext ? ctor.ext)
  
  sourcePath: (i) ->
    file = if i? and i < @files.length then @files[i] else @file
    @importPath @package.source(file), file
  
  compressFile: (data, cb) ->
    cb (require 'ncss') data
  

@StylesheetsSource = class StylesheetsSource extends Source
  @types = ['css', 'stylesheets']
  @ext = StylesheetsBundle.ext = '.css'
  @header = /^\/\*\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)\*\//m

  @Bundle: StylesheetsBundle
  
  test: (path) -> 
    util.hasExtension path, '.css'
  

Source.extend StylesheetsSource
Package.extend StylesheetsPackage
