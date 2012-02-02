_ = require 'underscore'
fs = require 'fs'
path = require 'path'
util = require '../util'
{Brewer, Source} = require '..'
{Bundle} = require '../bundle'

@JavascriptBrewer = class JavascriptBrewer extends Brewer
  @types = ['js', 'javascript']
  constructor: (options) ->
    _.defaults options, compress: true, compressed_name: "<%= filename %>.min.js"
    super options
    {@compressed, @build, @bundles, @compressed_name} = options
    @compressed_name = _.template @compressed_name
    @bundles = JSON.parse fs.readFileSync @bundles if _.isString @bundles
  
  
  shouldFollow: (relpath) -> @source(relpath).follow
  compressible: (relpath) ->
    path.join @source(relpath).js_path, util.changeExtension(relpath, '.js')
  
  compressAll: (cb) ->
    return unless @compressed
    @compileAll =>
      _.each @bundles, (bundle) =>
        @compress bundle, (pkg) =>
          console.log "Finished compressing #{bundle} -> #{pkg}"
          cb()
        
      
    
  
  packageAll: (cb) ->
    @compileAll =>
      _.each @bundles, (bundle) =>
        @package bundle, (pkg) =>
          console.log "Finished packaging #{bundle} -> #{pkg}"
          cb()
        
      
    
  

@JavascriptBundle = class JavascriptBundle extends Bundle
  constructor: (@brewer, @file) ->
    @ext = '.js'
    @uglify = require 'uglify-js'
    super @brewer, @file
  
  bundle: (cb) ->
    super (data) =>
      util.makedirs path.dirname fp = @filepath()
      fs.writeFile fp, data, 'utf-8', -> 
        cb fp
      
    
  
  compress: (cb) ->
    {parser, uglify} = @uglify
    {gen_code, ast_squeeze, ast_mangle} = uglify
    @brewer.deps @file, (@files) =>
      @stream = ''
      @readFile 0, (data) =>
        util.makedirs path.dirname fp = @compressed
        fs.writeFile fp, data, 'utf-8', -> 
          cb(fp)
        
      
      , (data) =>
        gen_code(ast_squeeze parser.parse(data)) + ';'
      
    
  

@JavascriptSource = class JavascriptSource extends Source
  @types = ['js', 'javascript']
  @Bundle = JavascriptBundle
  
  constructor: (options) ->
    _.defaults options, follow: true
    super options
    {@follow} = options
    @ext = '.js'
    @headerRE = /^\/\/\s*require\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/]+)/
    @js_path = @path
  

Source.extend JavascriptSource
Brewer.extend JavascriptBrewer
