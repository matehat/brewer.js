# ## The *Project* class
#
# This module exports the *Project* class. A *Project* object
# is tightly coupled with, as well as initialized with, a 
# [Brewfile](brewfile.html). It contains a set of 
# packages, as well as cross-project configurations, such as *vendor libraries*.
# Vendor libraries are entities that can export one or many 
# [sources](source.html), of different types, which can be used when 
# aggregating bundles. 
#
# > *TODO*: Vendor libraries are currently *not documented*, because, 
# although they are functional, there is no easy way for someone 
# to include them in their project. This is implemented mostly to prepare
# for an upcoming feature : *[Homebrew](http://mxcl.github.com/homebrew)-style 
# formulas*

# Underscore, core modules and CLI utilities are loaded.
_ = require 'underscore'
path = require 'path'
fs = require 'fs'
cli = require './command'
{testModule} = require './util'

# The Project class is initialized with a Brewfile, which immidiately
# calls the `setup` instance method. There, the `configs` function
# exported from [brewfile.coffee](brewfile.html) is called with the
# given brewfile as argument, to obtain an project configuration object.
# This object is then given default values and used to initialize
# the project vendor libraries and packages. Packages are inserted as
# *array elements* in the project.
class Project
  constructor: (@file) -> @setup()
  setup: ->
    try
      @configs = (require './brewfile').configs @file
      _.defaults @configs,
        root: '.'
        reqs: []
        packages: []
        vendorDir: './vendor'
    catch err
      if @configs?
        cli.error 'in', @file, err.message
      else
        throw err
    
    # *Registries for files and sources*. Those will hold all those
    # objects, neatly classified by types and access path.
    @files = {}
    @sources = {}
    
    @_pendingSources = 0
    @_ready = false
    @_ev = new (require 'events').EventEmitter()
    @_ev.on 'ready', => @_ready = true
  
  # This method is used to register a *Source* object. The `@sources`
  # variable maps to a list of sources, by type: `@sources[type] = 
  # [src1, src2, ...]`. After adding the source to the register, it is told 
  # to loop spawn its set of contained files. At the end of the crawling,
  # if not other sources are pending, we emit the 'ready' event.
  register: (src) ->
    (@sources[src.constructor.type] ?= []).push src
    @_pendingSources++
    
    src.files null, (files) =>
      @_ev.emit 'ready' if --@_pendingSources == 0
    
  
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
  
  
  # This method takes the result of the `requiredModules` below and tests each one
  # to see if the said modules are available. The method returns a list of unfound 
  # modules.
  missingModules: ->
    _.reject @requiredModules(), testModule
  
  
  # This method asks every packages and their sources to come up with requirements
  # regarding modules (coffee-script, less, etc.).
  requiredModules: ->
    _.chain(@sources)
      .values().flatten().invoke('requiredModules')
      .flatten().uniq().value()
  
  
  # This method proxies the method with the same name, invoked on all contained 
  # packages, and sets up a 
  # [FSWatchers](http://nodejs.org/docs/latest/api/fs.html#fs.FSWatcher) for the
  # Brewfile used for this project's configuration. It passes the `reset` instance
  # methods as the reset callback for all watching methods.
  watch: ->
    cnt = 0
    acc = =>
      if ++cnt is @length
        require('./index').watchers.incr()
        @configWatcher = fs.watch @file, (event) => @reset()
        @configWatcher.on 'error', _.bind(@reset, this)
        info 'Watching', require('./index').watchers.count, 'files'
    
    pkg.watch(_.bind(@reset, this), acc) for pkg in this
  
  
  # This method is the `reset` callback invoked when any relevant change occur
  # in the project. If an error is passed, it is thrown. Otherwise, the 
  # Brewfile FSWatcher is closed, and the `unwatch` method is called on each
  # packages. Finally, it deletes instance variables, contained packages and
  # re-invokes the `setup` instance method to start over.
  reset: (err) ->
    throw err if err?
    if @configWatcher?
      @configWatcher.close()
      delete @configWatcher
      require('./index').watchers.decr()
    
    for pkg, i in this
      pkg.unwatch()
      delete this[i]
    
    delete @length
    delete @vendorlibs
    @setup()
    @watch()
  
  
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
  


exports.Project = Project