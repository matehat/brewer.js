path = require 'path'
sys = require 'util'
util = require './util'
fs = require 'fs'
_ = require 'underscore'
{EventEmitter} = require 'events'

{Source} = require './source'
{File} = require './file'
{debug, info, finished} = require './command'

class Package extends EventEmitter
  @registry = {}
  @extend: (packages...) ->
    for package in packages
      @registry[package.type] = package
      for alias in (package.aliases ? [])
        @registry[alias] = package
  
  @create: (options, sources, vendor) ->
    throw "Package type #{options.type} not known" unless (typ = @registry[options.type])?
    new typ options, sources, vendor
  
  
  constructor: (@options, sources, @vendorlibs) ->
    {@name, bundles} = @options
    @files = {}
    @sources = {}
    @_ready = false
    @_pendingSources = 0
    
    @on 'ready', => @_ready = true
    
    (@registerSource Source.create(src, @) for src in sources)
    @bundlePaths = if _.isString bundles
      JSON.parse fs.readFileSync bundles
    else bundles
  
  ready: (cb) -> 
    if @_ready then cb() else @on 'ready', cb
  
  file: (relpath, type, fullpath, src) ->
    @files[type] ?= {}
    file = (_files = @files[type])[relpath]
    unless file?
      file = _files[relpath] = new File relpath, type, @
    
    file.attach fullpath, src if fullpath?
    return file
  
  actualize: (cb) ->
    @ready =>
      allFiles = []
      for type, files of @files
        for relpath, file of files
          allFiles.push file
      leaves = _.filter allFiles, (file) -> file.liabilities.length == 0
      i = 0
      (iter = ->
        leaves[i].actualize ->
          if ++i < leaves.length then iter() else cb()
      )()
  
  bundle: (imported, bundle, cb) ->
    output = ''
    parent = bundle.parent
    for file in parent.tsortedImports()
      output += file.readSync()
    
    bundle.write output, cb
    finished 'Packaged', bundle.fullpath
  
  registerSource: (src) ->
    (@sources[src.constructor.type] ?= []).push src
    @_pendingSources++
    
    src.files null, (files) =>
      @emit 'ready' if --@_pendingSources == 0
    
  
  clean: ->
    for file in @impermanents()
      file.unlinkSync()
  
  impermanents: ->
    acc = []
    for type, files of @files
      for file in _.values(files) when file.impermanent is true
        acc.push file
    acc
  
  registerFile: (file) ->
    type = @constructor.type
    # If the registered file is of the same type as the package and it has
    # the same relative path as a listed bundle, make a corresponding bundled 
    # file and register it
    if (fpath = file.relpath) in @bundlePaths and file.type is type
      bundle = @file fpath, "#{type}-bundle", @bundlePath(file)
      bundle.dependOnImports file, _.bind @bundle, @
      bundle.impermanent = true
      bundle.parent = file
      bundle.register()
      
      # If the package is configured to compress its bundles, make a corresponding
      # compressed file and register it
      if @compress
        compressed = @file fpath, "#{type}-bundle-minified", @compressedPath(file)
        compressed.dependOn bundle, _.bind @compressFile, @
        compressed.impermanent = true
        compressed.register()
  

exports.Package = Package