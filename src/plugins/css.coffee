_ = require 'underscore'
fs = require 'fs'
path = require 'path'
util = require './../util'
{Brewer, Source} = require './..'
{finished} = require '../command'
{Bundle} = require './../bundle'

@StylesheetsBrewer = class StylesheetsBrewer extends Brewer
  @types = ['css', 'stylesheets']
  constructor: (options) ->
    _.defaults options, compressed: true, compressedFile: "<%= filename %>.min.css"
    super options
    {@compressed, @build, @bundles, @compressedFile} = options
    @compressedFile = _.template @compressedFile
    @bundles = JSON.parse fs.readFileSync @bundles if _.isString @bundles
  
  compressAll: (cb) ->
    return unless @compressed
    _bundles = 0
    @compileAll =>
      _.each @bundles, (bundle) =>
        _bundles++
        @compress bundle, (pkg) =>
          cb() if --_bundles == 0
      
    
  
  packageAll: (cb) ->
    @compileAll =>
      _bundles = 0
      _.each @bundles, (bundle) => 
        _bundles++
        @package bundle, (pkg) =>
          cb() if --_bundles == 0
      
    
  

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
      util.makedirs path.dirname fp = @buildPath()
      fs.writeFile fp, data, 'utf-8', -> 
        finished 'Packaged', fp
        cb fp
    
  
  compress: (cb) ->
    fs.readFile @buildPath(), 'utf-8', (err, data) =>
      fs.writeFile @compressedFile, @ncss(data), 'utf-8', =>
        finished 'Compressed', @compressedFile
        cb @compressedFile
  

@StylesheetsSource = class StylesheetsSource extends Source
  @types = ['css', 'stylesheets']
  @Bundle: StylesheetsBundle
  
  constructor: (options) ->
    super options
    @ext = '.css'
    @css_path = @path
    @headerRE = /^\/\*\s*(?:require|import)\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)\*\//m
  
  test: (path) -> 
    util.hasExtension path, '.css'
  

Source.extend StylesheetsSource
Brewer.extend StylesheetsBrewer
