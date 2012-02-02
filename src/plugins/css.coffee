_ = require 'underscore'
fs = require 'fs'
path = require 'path'
util = require '../util'
{Brewer, Source, Bundle} = require '..'
{finished} = require '../command'

@StylesheetsBrewer = class StylesheetsBrewer extends Brewer
  @types = ['css', 'stylesheets']
  constructor: (options) ->
    _.defaults options, compressed: true, compressedFile: "<%= filename %>.min.css"
    super options
    {@compressed, @build, @bundles, @compressedFile} = options
    @compressedFile = _.template @compressedFile
    @bundles = JSON.parse fs.readFileSync @bundles if _.isString @bundles
  

@StylesheetsBundle = class StylesheetsBundle extends Bundle
  constructor: (@brewer, @file) ->
    @ext = '.css'
    super @brewer, @file
  
  sourcePath: (i) ->
    file = if i < @files.length then @files[i] else @file
    path.join @brewer.source(file).css_path, util.changeExtension file, '.css'
  
  bundle: (cb) ->
    super (data) =>
      util.makedirs path.dirname fp = @buildPath()
      fs.writeFile fp, data, 'utf-8', -> 
        finished 'Packaged', fp
        cb fp
    
  
  compress: (cb) ->
    ncss = require 'ncss'
    fs.readFile @buildPath(), 'utf-8', (err, data) =>
      fs.writeFile @compressedFile, ncss(data), 'utf-8', =>
        finished 'Compressed', @compressedFile
        cb @compressedFile
  

@StylesheetsSource = class StylesheetsSource extends Source
  @types = ['css', 'stylesheets']
  @ext = StylesheetsBundle.ext = '.css'
  @header = /^\/\*\s*(?:require|import)\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)\*\//m

  @Bundle: StylesheetsBundle
  
  constructor: (options) ->
    super options
    @css_path = @path
  
  test: (path) -> 
    util.hasExtension path, '.css'
  

Source.extend StylesheetsSource
Brewer.extend StylesheetsBrewer
