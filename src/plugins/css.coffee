_ = require 'underscore'
fs = require 'fs'
path = require 'path'
util = require './../util'
{Brewer, Source} = require './..'
{Bundle} = require './../bundle'

@StylesheetsBrewer = class StylesheetsBrewer extends Brewer
  @types = ['css', 'stylesheets']
  constructor: (options) ->
    _.defaults options, compress: true, compressedFile: "<%= filename %>.min.css"
    super options
    {@compress, @build, @bundles, @compressedFile} = options
    @compressedFile = _.template @compressedFile
    @bundles = JSON.parse fs.readFileSync @bundles if _.isString @bundles
  
  compressAll: (cb) ->
    return unless @compress
    _.each @bundles, (bundle) =>
      @compress bundle, (pkg) =>
        console.log "Finished compressing #{bundle} -> #{pkg}"
        cb()
      
    
  
  packageAll: (cb) ->
    _.each @bundles, (bundle) => 
      @package bundle, (pkg) =>
        console.log "Finished packaging #{bundle} -> #{pkg}"
        cb()
      
    
  

@StylesheetsBundle = class StylesheetsBundle extends Bundle
  constructor: (@brewer, @file) ->
    @ncss = require 'ncss'
    @ext = '.css'
    super @brewer, @file
  
  sourcePath: (i) ->
    file = if i < @files.length then @files[i] else @file
    path.join @brewer.source(file).css_path, util.changeExtension file, '.css'
  
  bundle: (cb) ->
    super (data) =>
      util.makedirs path.dirname fp = @filepath()
      fs.writeFile fp, data, 'utf-8', -> cb fp
    
  
  compress: (cb) ->
    fs.readFile @buildPath(), 'utf-8', (err, data) =>
      fs.writeFile @compressedFile, @ncss(data), 'utf-8', => cb @compressedFile
  

@StylesheetsSource = class StylesheetsSource extends Source
  @types = ['css', 'stylesheets']
  @Bundle: StylesheetsBundle
  
  constructor: (options) ->
    super options
    @ext = '.css'
    @css_path = @path
    @headerRE = /^\/\*\s*require\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)\*\//
  
  test: (path) -> 
    util.hasExtension path, '.css'
  

Source.extend StylesheetsSource
Brewer.extend StylesheetsBrewer
