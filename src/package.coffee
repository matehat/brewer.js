path = require 'path'
sys = require 'util'
util = require './util'
fs = require 'fs'
_ = require 'underscore'
{EventEmitter} = require 'events'

{Source} = require './source'
{File} = require './file'
{debug, info} = require './command'

class Package extends EventEmitter
  @registry = {}
  @extend: (packages...) ->
    for package in packages
      for type in (package.types ? [])
        @registry[type] = package
  
  @create: (options, sources, vendor) ->
    throw "Package type #{options.type} not known" unless (typ = @registry[options.type])?
    new typ options, sources, vendor
  
  
  constructor: (@options, sources, @vendor) ->
    {@name, bundles} = @options
    @files = {}
    @sources = {}
    @_ready = false
    
    (@registerSource Source.create(src, @) for src in sources)
    @bundlePaths = if _.isString bundles
      JSON.parse fs.readFileSync bundles
    else bundles
  
  ready: (cb) ->
    return cb() if @_ready
    @on 'ready', ->
      @_ready = true
      cb()
  
  file: (relpath, type, fullpath, src) ->
    @files[type] ?= {}
    file = (_files = @files[type])[relpath]
    unless file?
      file = _files[relpath] = new File relpath, type, @
    
    file.attach fullpath, src if fullpath?
    debug '%%%','file:', @name, file.fullpath, file.relpath, file.type
    return file
  
  actualize: (cb) ->
    debug 'Actualizing', @name
    allFiles = []
    for type, files of @files
      for relpath, file of files
        allFiles.push file
    leaves = _.filter allFiles, (file) -> file.liabilities.length == 0
    debug f.fullpath for f in leaves
    i = 0
    (iter = ->
      leaves[i].actualize ->
        if ++i < leaves.length then iter() else cb()
    )()
  
  bundle: (imported, bundle, cb) ->
    output = ''
    for file in bundle.tsortedImports()
      output += file.readSync()
    
    bundle.write output, cb
  
  registerSource: (src) ->
    for type in ['all', 'loading', src.constructor.types...]
      (@sources[type] ?= []).push src
    
    src.files null, (files) =>
      @sources.loading = _.without @sources.loading, src
      if @sources.loading.length == 0
        @emit 'ready'
  
  registerFile: (file) ->
    type = @constructor.types[0]
    # If the registered file is of the same type as the package and it has
    # the same relative path as a listed bundle, make a corresponding bundled 
    # file and register it
    if (fpath = file.relpath) in @bundlePaths and file.type is type
      bundle = @file fpath, "#{type}-bundle", @bundlePath(file)
      bundle.dependOnImports file, _.bind @bundle, @
      bundle.register()
      
      # If the package is configured to compress its bundles, make a corresponding
      # compressed file and register it
      if @compress
        compressed = @file fpath, "#{type}-bundle-minified", @compressedPath(file)
        compressed.dependOn bundle, _.bind @compressFile, @
        compressed.register()
  

exports.Package = Package