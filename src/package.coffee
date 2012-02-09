path = require 'path'
sys = require 'util'
util = require './util'
fs = require 'fs'
_ = require 'underscore'

{Source} = require './source'
{File} = require './file'
{debug, info} = require './command'

class Package
  @registry = {}
  @extend: (packages...) ->
    for package in packages
      for type in (package.types ? [])
        @registry[type] = package
  
  @create: (options, sources, vendor) ->
    throw "Package type #{options.type} not known" unless (typ = @registry[options.type])?
    new typ options, sources, vendor
  
  
  constructor: (@options, sources, @vendor) ->
    {@name} = @options
    (@registerSource Source.create(src, @) for src in sources)
    @files = {}
    @sources = {}
    @bundlePaths = if _.isString bundles
      JSON.parse fs.readFileSync bundles
    else bundles
  
  
  file: (relpath, type, fullpath, src) ->
    _files = @files[file.type] ?= {}
    return file if (file = _files[relpath])?
    file = _files[relpath] = new File relpath, type, @
    file.attach fullpath, src if fullpath?
    return file
  
  actualize: (cb) ->
    allFiles = _.flatten (files for type, files of @files), true
    leaves = _.filter allFiles, (file) -> file.liabilities.length == 0
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
    for type in ['all', src.types...]
      (@sources[type] ?= []).push src
      src.files()
  
  registerFile: (file) ->
    type = @constructor.types[0]
    # If the registered file is of the same type as the package and it has
    # the same relative path as a listed bundle, make a corresponding bundled 
    # file and register it
    if (path = file.relpath) in @bundlePaths and file.type is type
      bundle = @file path, "#{type}-bundle", @bundlePath(file)
      bundle.dependOnImports file, _.bind @bundle, @
      bundle.register()
      
      # If the package is configured to compress its bundles, make a corresponding
      # compressed file and register it
      if @compressed
        compressed = @file path, "#{type}-bundle-minified", 
          path.join(@build, @compressedPath(file))
        compressed.dependOn bundle, _.bind @compress, @
        compressed.register()
  

exports.Package = Package