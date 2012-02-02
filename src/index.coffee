path  = require 'path'
sys   = require 'util'
util  = require './util'
fs    = require 'fs'
_     = require 'underscore'

bundles = require './bundle'
sources = require './source'

class Brewer
  constructor: (options) ->
    {sources, @name} = options
    @sources = (Source.create(src) for src in sources)
    @filecache = {}
  
  findFile: (relpath, dep=false) ->
    return loc if (loc = @filecache[relpath])?
    for src in @sources
      if fpath = src.find relpath
        return @filecache[relpath] = path: fpath, source: src
    throw "File not found: #{relpath}"
  
  fullpath: (relpath) -> @findFile(relpath).path
  source: (relpath) -> @findFile(relpath).source
  compressible: (relpath) ->
    @source(relpath).path
  
  deps: (relpath, cb) ->
    return cb [] if not @shouldFollow relpath
    fs.readFile @fullpath(relpath), 'utf-8', (err, data) =>
      cb [] if (deps = @source(relpath).deps data).length == 0
      @_recurse_deps deps, (files) ->
        cb files
  
  _recurse_deps: (filelist, cb) ->
    i = 0
    filelist = _.uniq filelist
    files = filelist[0..]
    _.each filelist, (file) =>
      @deps file, (deps) ->
        files.unshift(deps...) if deps.length > 0
        cb(_.uniq files) if ++i == filelist.length
  
  
  compileAll: (cb) ->
    cnt = 0
    for src in @sources
      if src.compileAll?
        ++cnt and src.compileAll =>
          cb() if --cnt == 0
  

class JavascriptBrewer extends Brewer
  constructor: (options) ->
    _.defaults options, compress: true, compressed_name: "<%= filename %>.min.js"
    super options
    {@compressed, @build, @bundles, @compressed_name} = options
    @compressed_name = _.template @compressed_name
    @bundles = JSON.parse fs.readFileSync @bundles if _.isString @bundles
  
  
  shouldFollow: (relpath) -> @source(relpath).follow
  compressible: (relpath) ->
    path.join @source(relpath).js_path, util.changeExtension(relpath, '.js')
  
  compress: (bundle, cb) -> 
    (new bundles.JavascriptBundle @, bundle).compress cb
  
  compressAll: (cb) ->
    return unless @compressed
    @compileAll =>
      _.each @bundles, (bundle) =>
        @compress bundle, (pkg) =>
          sys.puts "Finished compressing #{bundle} -> #{pkg}"
          cb()
  
  package: (bundle, cb) -> 
    (new bundles.JavascriptBundle @, bundle).bundle cb
  
  packageAll: (cb) ->
    @compileAll =>
      _.each @bundles, (bundle) =>
        @package bundle, (pkg) =>
          sys.puts "Finished packaging #{bundle} -> #{pkg}"
          cb()
  

class StylesheetsBrewer extends Brewer
  constructor: (options) ->
    _.defaults options, compress: true, compressed_name: "<%= filename %>.min.css"
    super options
    {@compressed, @build, @bundles, @compressed_name} = options
    @compressed_name = _.template @compressed_name
    @bundles = JSON.parse fs.readFileSync @bundles if _.isString @bundles
  
  compress: (bundle, cb) ->
    (new bundles.CSSBundle @, bundle).compress cb if @compressed
  
  compressAll: (cb) ->
    return unless @compressed
    _.each @bundles, (bundle) =>
      @compress bundle, (pkg) =>
        sys.puts "Finished compressing #{bundle} -> #{pkg}"
        cb()
  
  package: (bundle, cb) -> 
    (new bundles.CSSBundle @, bundle).bundle cb
  
  packageAll: (cb) ->
    _.each @bundles, (bundle) => 
      @package bundle, (pkg) =>
        sys.puts "Finished packaging #{bundle} -> #{pkg}"
        cb()
  

class SassBrewer extends StylesheetsBrewer
  package: (bundle, cb) ->
    (new bundles.SassBundle @, bundle).bundle cb
  
  packageAll: (cb) ->
    if bundles.length == 0 then bundles = @bundles
    _.each bundles, (bundle) => 
      @package bundle, (pkg) =>
        sys.puts "Finished packaging #{bundle} -> #{pkg}"
        cb()
  

@Brewer = Brewer =
  create: (options) -> new @[options.type] options
  
  javascript:   JavascriptBrewer
  js:           JavascriptBrewer
  
  sass:         SassBrewer

@Source = Source = 
  create: (options) -> new @[options.type] options
  
  javascript:   sources.JavascriptSource
  js:           sources.JavascriptSource
  coffeescript: sources.CoffeescriptSource
  cs:           sources.CoffeescriptSource
  
  sass:         sources.SassSource
