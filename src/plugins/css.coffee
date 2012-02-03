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
    path.join @brewer.source(file).css_path, util.changeExtension file, '.css'
  
  compress: (cb) ->
    ncss = require 'ncss'
    util.newer (cmpFile = @compressedFile), (buildPath = @buildPath())
    , (err, newer) =>
      if newer
        finished 'Unchanged', cmpFile
        return cb(cmpFile)
      fs.readFile buildPath, 'utf-8', (err, data) =>
        fs.writeFile cmpFile, ncss(data), 'utf-8', =>
          finished 'Compressed', cmpFile
          cb cmpFile
  

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
