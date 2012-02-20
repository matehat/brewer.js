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
{debug, warning, error, info, finished} = require './command'

# This function only tries to import the given module, and if it fails it returns
# `false` if error corresponds to a missing module error.
testModule = (mod) ->
  try
    require(mod)
  catch err
    err.message.indexOf('Cannot find module') is -1


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
        error 'in', @file, err.message
      else
        throw err
    
    {@root, reqs, packages, vendorDir} = @configs
    @vendorlibs = new VendorLibraries this, vendorDir, reqs
    @length = packages.length
    _.each packages, (pkg, i) =>
      this[i] = (require './package').Package.create pkg.opts, pkg.srcs, @vendorlibs
    
  
  
  # These two methods barely proxy methods with the same name, but invoked on all 
  # contained packages.
  clean: ->
    pkg.clean?() for pkg in this
  
  prepare: ->
    pkg.prepare?() for pkg in this
  
  
  # This method takes the result of the `requiredModules` below and tests each one
  # to see if the said modules are available. The method returns a list of unfound 
  # modules.
  missingModules: ->
    _.reject @requiredModules(), testModule
  
  
  # This method asks every packages and their sources to come up with requirements
  # regarding modules (coffee-script, less, etc.).
  requiredModules: ->
    _.chain(this)
      .invoke('requiredModules').flatten().uniq()
      .value()
  
  
  # This method tries to install the missing modules into Brewer.js project 
  # directory. It first caches the previous working directory before changing to
  # brewer.js root directory, so to return in the previous state.
  installMissingModules: (cb) ->
    {spawn} = require 'child_process'
    brewerdir = path.resolve __dirname, '..'
    modules = @missingModules()
    i = 0
    iterate = ->
      if i is modules.length
        cb() if cb?
        return
      
      mod = modules[i++]
      info 'Installing', mod
      npm = spawn 'npm', ['install', mod], {cwd: brewerdir}
      npm.stdout.pipe process.stdout
      npm.stderr.pipe process.stderr
      npm.on 'exit', ->
        finished 'installed', mod
        iterate()
    
    iterate()
  
  
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
  

class VendorLibraries
  constructor: (@project, vendorDir, @requirements) ->
    @root = path.join @project.root, vendorDir
    (require './util').makedirs @root
    @libs = @read()
  
  stateFile: -> 
    path.join @root, 'libraries.json'
  
  read: ->
    if path.existsSync(stateFile = @stateFile())
      JSON.parse fs.readFileSync stateFile, 'utf-8'
    else
      {}
  
  write: ->
    fs.writeFileSync @stateFile(), JSON.stringify(@libs), 'utf-8'
  
  libraries: (type) ->
    libs = []
    for name, lib of @libs
      for dpath, dir of lib.content when dir.type is type
        _lib = {path: path.join(@root, name, dpath)}
        _.extend _lib, dir
        libs.push _lib
    
    libs
  

exports.Project = Project