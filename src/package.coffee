# ## The Package class
#
# This module exports the *Package* class. A *Package* is a conceptual
# container within which source files can reference each other as "imports".
# Packages can produce *bundles*, a particular *[File](file.html)* which 
# content is the result of recursively aggregating all imports from a file, 
# from its imports, and so on. Packages can have one or many 
# *[Sources](source.html)*, in which it looks for files to aggregate bundles.
# Packages have a type (*javascript* or *css*) which is the type of bundles
# it produces.
#
# Objects of this class are not meant to be initialized directly, but rather
# produced at the initialization of a *[Project](project.html)*.

# Underscore, brewer.js classes and CLI utilities are loaded up.
_ = require 'underscore'
util = require './util'
{Source} = require './source'
{File} = require './file'
{debug, info, finished} = require './command'

class Package extends (require 'events').EventEmitter
  # The Package class needs to maintain a registry of its subclasses, which 
  # maps types to subclasses. `Package.extend(packages*)` adds subclasses to 
  # the registry, and `Package.create(options, sources, vendor)` creates an 
  # instance of the appropriate subclass, given `options.type` is registered.
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
    fs = require 'fs'
    
    _.defaults options, compress: true
    ctor = @constructor
    {@name, @compress, @build, bundles} = @options
    @files = {}
    @sources = {}
    @_ready = false
    @_pendingSources = 0
    
    @on 'ready', => @_ready = true
    
    (@registerSource Source.create(src, @) for src in sources)
    @bundlePaths = if _.isString bundles
      JSON.parse fs.readFileSync bundles
    else (bundles ?= [])
    
    for lib in @vendorlibs.libraries ctor.type
      lib.watch ?= false
      @registerSource Source.create lib, @
  
  file: (relpath, type, fullpath, src) ->
    @files[type] ?= {}
    file = (_files = @files[type])[relpath]
    unless file?
      file = _files[relpath] = new File relpath, type, @
    
    file.attach fullpath, src if fullpath?
    return file
  
  registerSource: (src) ->
    (@sources[src.constructor.type] ?= []).push src
    @_pendingSources++
    
    src.files null, (files) =>
      @emit 'ready' if --@_pendingSources == 0
    
  
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
  
  bundle: (imported, bundle, cb) ->
    output = ''
    parent = bundle.parent
    for file in parent.tsortedImports()
      output += file.readSync()
    
    bundle.write output, cb
    finished 'Packaged', bundle.fullpath
  
  bundlePath: (file) -> 
    (require 'path').join @build, util.changeext file.relpath, @constructor.ext
  
  compressedPath: (file) ->
    (require 'path').join @build, if @compress is true
      util.changeext file.relpath, @constructor.compressedext
    else
      _.template(compress) filename: file.relpath
  
  ready: (cb) -> 
    if @_ready then cb() else @on 'ready', cb
  
  actualize: (cb) ->
    @ready =>
      allFiles = []
      for type, files of @files
        for relpath, file of files
          allFiles.push file
      leaves = _.filter allFiles, (file) -> file.liabilities.length == 0
      i = 0
      iter = ->
        return process.nextTick(cb) if i is leaves.length
        leaves[i++].actualize iter
      
      iter()
  
  watch: (reset) ->
    @actualize =>
      for type, sources of @sources
        for src in sources
          src.watch reset
    
      for type, files of @files
        for relpath, file of files
          file.watch reset
      
  
  unwatch: (cb) ->
    for type, sources of @sources
        for src in sources
          src.unwatch()
    
    for type, files of @files
      file.unwatch() for relpath, file of files
    
  
  clean: ->
    for file in @impermanents()
      file.unlinkSync()
  
  impermanents: ->
    acc = []
    for type, files of @files
      for file in _.values(files) when file.impermanent is true
        acc.push file
    acc
  

exports.Package = Package