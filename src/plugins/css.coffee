_ = require 'underscore'
fs = require 'fs'
path = require 'path'
util = require './../util'
{Brewer, Source} = require './..'
{Bundle} = require './../bundle'

@StylesheetsBrewer = class StylesheetsBrewer extends Brewer
  @types = ['css', 'stylesheets']
  constructor: (options) ->
    _.defaults options, compress: true, compressed_name: "<%= filename %>.min.css"
    super options
    {@compressed, @build, @bundles, @compressed_name} = options
    @compressed_name = _.template @compressed_name
    @bundles = JSON.parse fs.readFileSync @bundles if _.isString @bundles
  
  compressAll: (cb) ->
    return unless @compressed
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
  
  bundle: (cb) ->
    super (data) =>
      util.makedirs path.dirname fp = @filepath()
      fs.writeFile fp, data, 'utf-8', -> cb fp
    
  
  compress: (cb) ->
    fs.readFile @filepath(), 'utf-8', (err, data) =>
      fs.writeFile @compressed, @ncss(data), 'utf-8', => cb @compressed

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
