_ = require 'underscore'
fs = require 'fs'
path = require 'path'

{Package, Source} = require '..'
util = require '../util'
{Bundle} = require '../bundle'
{finished} = require '../command'

@JavascriptPackage = class JavascriptPackage extends Package
  @types = ['js', 'javascript']
  @default = 'javascript'
  
  constructor: (options, sources) ->
    super options, sources
    _.defaults options, compress: true
    {compress, @build, @bundles} = options
    @bundles = JSON.parse fs.readFileSync @bundles if _.isString @bundles
    
    if compress
      @compressedFile = _.template if _.isString compress 
        compress
      else 
        "<%= filename %>.min.js"
  


@JavascriptBundle = class JavascriptBundle extends Bundle
  sourcePath: (i) ->
    file = if i < @files.length then @files[i] else @file
    src = @package.source(file)
    path.join (src.js_path ? src.path), util.changeExtension file, '.js'
  
  compressFile: (data, cb) ->
    {parser, uglify} = require 'uglify-js'
    {gen_code, ast_squeeze, ast_mangle} = uglify
    cb gen_code ast_squeeze parser.parse data
  
  

@JavascriptSource = class JavascriptSource extends Source
  @Bundle = JavascriptBundle
  @types = ['js', 'javascript']
  @ext = JavascriptBundle.ext = '.js'
  @header = /^\/\/\s*(?:import|require)\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m


Source.extend JavascriptSource
Package.extend JavascriptPackage
