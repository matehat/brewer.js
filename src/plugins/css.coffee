_ = require 'underscore'
fs = require 'fs'
path = require 'path'
util = require '../util'
{Brewer, Source, Bundle} = require '..'
{finished} = require '../command'

@StylesheetsBrewer = class StylesheetsBrewer extends Brewer
  @types = ['css', 'stylesheets']
  constructor: (options) ->
    super options
    _.defaults options, compress: true
    {compress, @build, @bundles} = options
    @bundles = JSON.parse fs.readFileSync @bundles if _.isString @bundles
    if compress
      @compressedFile = _.template if _.isString(compress) then compress else "<%= filename %>.min.css"
  

@StylesheetsBundle = class StylesheetsBundle extends Bundle
  constructor: (@brewer, @file) ->
    @ext = '.css'
    super @brewer, @file
  
  sourcePath: (i) ->
    file = if i? and i < @files.length then @files[i] else @file
    src = @brewer.source(file)
    path.join (src.css_path ? src.path), util.changeExtension file, '.css'
  
  compressFile: (data, cb) ->
    cb (require 'ncss') data
  

@StylesheetsSource = class StylesheetsSource extends Source
  @types = ['css', 'stylesheets']
  @ext = StylesheetsBundle.ext = '.css'
  @header = /^\/\*\s*(?:require|import)\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)\*\//m

  @Bundle: StylesheetsBundle
  
  constructor: (options) ->
    super options
  
  test: (path) -> 
    util.hasExtension path, '.css'
  

Source.extend StylesheetsSource
Brewer.extend StylesheetsBrewer
