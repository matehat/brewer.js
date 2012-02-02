_ = require 'underscore'
fs = require 'fs'
path = require 'path'
util = require '../util'
{Brewer, Source} = require '..'
{Bundle} = require '../bundle'
{finished} = require '../command'

@JavascriptBrewer = class JavascriptBrewer extends Brewer
  @types = ['js', 'javascript']
  constructor: (options) ->
    _.defaults options, compress: true, compressedFile: "<%= filename %>.min.js"
    super options
    {@compressed, @build, @bundles, @compressedFile} = options
    @compressedFile = _.template @compressedFile
    @bundles = JSON.parse fs.readFileSync @bundles if _.isString @bundles
  
  compressAll: (cb) ->
    return unless @compressed
    @compileAll =>
      _.each @bundles, (bundle) =>
        @compress bundle, (pkg) =>
          finished 'Compressed', pkg
          cb()
        
      
    
  
  packageAll: (cb) ->
    @compileAll =>
      _.each @bundles, (bundle) =>
        @package bundle, (pkg) =>
          finished 'Packaged', pkg
          cb()
        
      
    
  

@JavascriptBundle = class JavascriptBundle extends Bundle
  constructor: (@brewer, @file) ->
    @ext = '.js'
    @uglify = require 'uglify-js'
    super @brewer, @file
  
  sourcePath: (i) ->
    file = if i < @files.length then @files[i] else @file
    path.join @brewer.source(file).js_path, util.changeExtension file, '.js'
  
  bundle: (cb) ->
    super (data) =>
      util.makedirs path.dirname fp = @buildPath()
      fs.writeFile fp, data, 'utf-8', -> 
        cb fp
      
    
  
  compress: (cb) ->
    {parser, uglify} = @uglify
    {gen_code, ast_squeeze, ast_mangle} = uglify
    fs.readFile @buildPath(), 'utf-8', (err, data) =>
      code = gen_code ast_squeeze parser.parse data
      fs.writeFile (fp = @compressedFile), code, 'utf-8', ->
        cb fp
      
    
  

@JavascriptSource = class JavascriptSource extends Source
  @types = ['js', 'javascript']
  @Bundle = JavascriptBundle
  
  constructor: (options) ->
    super options
    @ext = '.js'
    @js_path = @path
    @headerRE = /^\/\/\s*(?:import|require)\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m
  

Source.extend JavascriptSource
Brewer.extend JavascriptBrewer
