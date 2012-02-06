path  = require 'path'
sys   = require 'util'
util  = require './util'
fs    = require 'fs'
_     = require 'underscore'

{Source} = require './source'

@Package = class Package
  @registry = {}
  @extend: (packages...) ->
    for package in packages
      for type in (package.types ? [])
        @registry[type] = package
  
  @create: (options) ->
    throw "Package type #{options.type} not known" unless (typ = @registry[options.type])?
    new typ options
  
  
  constructor: (options) ->
    {sources, @name} = options
    @sources = (Source.create(src, @) for src in sources)
    @filecache = {}
  
  shouldFollow: (relpath) -> 
    @source(relpath).follow
  
  findFile: (relpath, dep=false) ->
    return loc if (loc = @filecache[relpath])?
    for src in @sources
      if fpath = src.find relpath
        return @filecache[relpath] = path: fpath, source: src
    throw "File not found: #{relpath}"
  
  fullPath: (relpath) ->
    @findFile(relpath).path
  
  source: (relpath) -> 
    @findFile(relpath).source
  
  bundleObj: (relpath) ->
    new (@source(relpath).constructor.Bundle)(@, relpath)
  
  
  deps: (relpath, cb) ->
    return cb [] if not @shouldFollow relpath
    fs.readFile @fullPath(relpath), 'utf-8', (err, data) =>
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
      
    
  
  
  compress: (relpath, cb) ->
    @bundleObj(relpath).compress cb
  
  bundle: (relpath, cb) -> 
    @bundleObj(relpath).bundle cb
  
  
  compileAll: (cb) ->
    srcs = (src for src in @sources when src.compileAll?)
    cb() if (cnt = srcs.length) == 0
    src.compileAll(-> cb() if --cnt == 0) for src in srcs
  
  compressAll: (cb) ->
    return unless @compressedFile
    @compileAll =>
      cnt = @bundles.length
      _.each @bundles, (bundle) =>
        @compress bundle, (pkg) =>
          cb() if --cnt == 0
        
      
    
  
  bundleAll: (cb) ->
    @compileAll =>
      cnt = @bundles.length
      _.each @bundles, (bundle) => 
        @bundle bundle, (pkg) =>
          cb() if --cnt == 0
      
    
  
