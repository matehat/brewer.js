# ## The *Package* class
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

# ### Subclassing
# 
# The *Package* class can be subclassed for different types of bundled files
# by specifying a few class properties and the compression mechanism.
# 
# * `@type`
#   
#   The source type of the *Package* subclass. This implies that bundles are
#   aggregated from source files of this type, and such package can be created
#   in a project by using, for instance, a `@stylesheets' statement in a Brewfile.
#
# * `@aliases`
#
#   A list of aliases for the defined `@type`. This specifies
#   a list of drop-in replacement names.
#
# * `@compressedext`
#
#   The suffix appended to an access path when creating
#   a compressed counterpart to a bundle. This is not used if the `@compress`
#   instance variable is an *Underscore template string*.
#
# * `@ext`
#
#   The suffix appended to an access path when creating a bundle from
#   a source file.

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
  @types: -> 
    (type for own type of this when type not in ['types', 'extend', 'create'])
  
  @extend: (packages...) ->
    for pkg in packages
      this[pkg.type] = pkg
      for alias in (pkg.aliases ? [])
        this[alias] = pkg
  
  @create: (options, sources, vendor) ->
    throw "Package type #{options.type} not known" unless (typ = this[options.type])?
    new typ options, sources, vendor
  
  
  # A Package is not meant to be initialized directly, but rather through a 
  # *Project* object, which knows about *vendor libraries* (more details about
  # those in [project.coffee](project.html)). The first argument, *options*,
  # is the result of evaluating a package section of a 
  # [Brewfile](brewfile.html#section-7).
  constructor: (@options, sources, @vendorlibs) ->
    fs = require 'fs'
    ctor = @constructor
    
    # * `build` specifies the build directory, where aggregated bundles are put.
    # * `bundles` specifies the access path of bundles.
    # * `compress` can either be a boolean, or a 
    # [template string](http://underscorejs.org/#template)
    _.defaults options, {
      compress: true
      build: './build'
      bundles: []
    }
    {@name, @compress, @build, bundles} = @options
    @bundlePaths = if _.isString bundles
      JSON.parse fs.readFileSync bundles
    else bundles
    
    # *Registries for files and sources*. Those will hold all those
    # objects, neatly classified by types and access path.
    @files = {}
    @sources = {}
    
    # *State tracking variables*. Since sources are crawled asynchronously,
    # a package object is not ready upfront. We need those variables to
    # act only when appropriate. When the 'ready' event is fired, we update
    # our state.
    @_ready = false
    @_pendingSources = 0
    @on 'ready', => @_ready = true
    
    # All specified sources and vendor libraries are initialized and 
    # registered. Vendor libraries, by default don't have to be watched.
    for src in sources
      @registerSource Source.create src, this
    
    for lib in @vendorlibs.libraries ctor.type
      _.defaults lib, {watch: false}
      @registerSource Source.create lib, this
    
    # This event is triggered when a file `register` method is called. This is used
    # to indicate that a file has beed created and properly configured. In a package,
    # we need to know when that happens to detect files that corresponds to bundles
    # and act appropriately. Other parts of the system might hook to this event.
    @on 'newfile', (file) =>
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
    
  
  
  # This method returns a *File* object that corresponds to the given
  # arguments, in terms of access path, type and optionally fullpath and
  # source. If the specification does not corresponds to an existing file,
  # it creates the file and binds it to the appropriate objects. This is 
  # used to reference a file that might not exist yet, and that should be
  # attached later to a file on disk. The `@files` variable is a 
  # 2-dimensional map : `@file[type][access path]` maps to one and only one 
  # *File* object.
  file: (relpath, type, fullpath, src) ->
    @files[type] ?= {}
    file = (_files = @files[type])[relpath]
    unless file?
      file = _files[relpath] = new File relpath, type, this
    
    file.attach fullpath, src if fullpath?
    return file
  
  
  # This method is used to register a *Source* object. The `@sources`
  # variable maps to a list of sources, by type: `@sources[type] = 
  # [src1, src2, ...]`. After adding the source to the register, it is told 
  # to loop spawn its set of contained files. At the end of the crawling,
  # if not other sources are pending, we emit the 'ready' event.
  registerSource: (src) ->
    (@sources[src.constructor.type] ?= []).push src
    @_pendingSources++
    
    src.files null, (files) =>
      @emit 'ready' if --@_pendingSources == 0
    
  
  
  # This method is used to produce a bundle file by aggregating all the
  # necessary imported files. It uses `file.tsortedImports` to obtain a
  # sorted list of all necessary imports, then iterate through each, creating
  # a ReadStream and piping the content to the bundle's WriteStream. When
  # all content have been read, close the WriteStream and print a confirmation.
  bundle: (imported, bundle, cb) ->
    i = 0
    imports = bundle.parent.tsortedImports()
    ws = bundle.writeStream()
    ws.on 'close', ->
      finished 'Packaged', bundle.fullpath
      cb()
    
    iter = ->
      if i is imports.length
        ws.end()
        return
      
      rs = imports[i++].readStream()
      return iter() unless rs?
      rs.pipe ws, {end: false}
      rs.on 'end', iter
    
    iter()
  
  
  # This method returns the full path to a bundle file.
  bundlePath: (file) -> 
    (require 'path').join @build, util.changeext file.relpath, @constructor.ext
  
  
  # This method returns the full path to the compressed bundle file.
  compressedPath: (file) ->
    (require 'path').join @build, if @compress is true
      util.changeext file.relpath, @constructor.compressedext
    else
      _.template(compress) filename: file.relpath
  
  
  # This method returns a list of modules required by the package, in its 
  # current state, including its contained sources, to function properly.
  requiredModules: ->
    _.chain(@sources)
      .values().flatten().invoke('requiredModules')
      .flatten().uniq().value()
  
  
  # This method is used to make sure the package is ready before 
  # performing an action. It takes a continuation callback, called
  # immediately if the package is already ready, or as soon as it is.
  ready: (cb) -> 
    if @_ready then cb() else @on 'ready', cb
  
  
  # This method is used to perform all necessary tranforming and 
  # aggregating actions for all files in the package. This includes
  # compiling files into their *javascript* or *css* equivalents, 
  # aggregating bundles and compressing them. This is done by finding 
  # all files that are not depended by any other files (root nodes),
  # and calling their [`actualize`](file.html#section-7) method, one 
  # after the other, asynchronously.
  actualize: (cb) ->
    @ready =>
      allFiles = []
      for type, files of @files
        for relpath, file of files
          allFiles.push file
      roots = _.filter allFiles, (file) -> file.liabilities.length == 0
      i = 0
      iter = ->
        return process.nextTick(cb) if i is roots.length
        roots[i++].actualize iter
      
      iter()
    
  
  
  # This method is used to first `actualize` a project and watching 
  # behavior on all files and sources and carrying over the reset callback,
  # provided usually by the parent `Project` object.
  watch: (reset, ready) ->
    @actualize =>
      for type, sources of @sources
        for src in sources
          src.watch reset
    
      for type, files of @files
        for relpath, file of files
          file.watch reset
      
      ready() if ready?
  
  
  # This method is used to remove the 
  # [FSWatchers](http://nodejs.org/docs/latest/api/fs.html#fs.FSWatcher) 
  # from all files and sources. 
  unwatch: ->
    for type, sources of @sources
        for src in sources
          src.unwatch()
    
    for type, files of @files
      file.unwatch() for relpath, file of files
    
  
  
  # This method is used to remove all files that were marked as 
  # *impermanent* (see next method).
  clean: ->
    @ready =>
      for file in @impermanents()
        file.unlinkSync()
  
  
  # This method returns a list of all *impermanent* files which includes, 
  # for instance, compiled files, bundles
  # and their compressed counterparts. The rationale behind this is that
  # those files are all completely derived from source files, thus could
  # be removed safely without losing information.
  impermanents: ->
    acc = []
    for type, files of @files
      for file in _.values(files) when file.impermanent is true
        acc.push file
    acc
  

exports.Package = Package