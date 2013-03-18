# ## The *Source* class
# 
# This module exports the *Source* class. A source object is bound to a path
# on disk and a file type (*javascript*, *css*, *coffeescript*, *less*, etc).
# It provides a set of source files, those that are found by recursively
# walking the referenced directory, and testing all files it can find.
# It is also bound to a parent package, to which its files are registered.

# ### Subclassing
#
# The *Source* class is subclassed to implement compilation behavior, such as
# for coffee-script. In these cases, for every single *source* file, a 
# *compiled* file is also created, of which the type must correspond to
# that of the parent package.
#
# Here is a rundown of the class properties that must be specified on subclass
# so to function properly :
#
# * `@type`
#   
#   The source type of the *Source*. This implies that files that are
#   found under this directory are of this type. This also makes the 
#   `@stylesheets`, for instance, name available in the package body of a 
#   Brewfile to create a source of this type.
#
# * `@aliases`
#
#   A list of aliases for the defined `@type`. This specifies
#   a list of drop-in replacement names.
#
# * `@header`
#
#   The header regular expression used to find `import` statements in
#   source files.
#
# * `@ext`
#
#   The file extension checked to yield appropriate files from the source.

# Common utilities are loaded up.
util  = require './util'
{debug, info} = require './command'
_ = require 'underscore'

class Source
  # Much like for *[Package](package.html#section-3)*, a registry of subclasses
  # must be maintained to associate types (*coffeescript*, *less*, *javascript*, 
  # etc) to particular subclasses of *Source*. Type aliases, alternate type namings,
  # are also associated to the same subclasses, so to stay flexible.
  @types: -> 
    (type for own type of this when type not in ['types', 'extend', 'create'])
  
  @extend: (sources...) ->
    for src in sources
      this[src.type] = src
      for alias in (src.aliases ? [])
        this[alias] = src
  
  @create: (options, pkg) ->
    throw "Source type #{options.type} not known" unless (typ = this[options.type])?
    new typ options, pkg
  
  
  # A *Source* is initialized with an option object, which is the result of 
  # evaluating a *source directive* in a [Brewfile](brewfile.html#section-5).
  # After setting instance variables, the path to the source directory is
  # created recursively.
  constructor: (@options, @package) ->
    {join} = require 'path'
    (require 'underscore').defaults @options, {watch: true}
    {@path, @requirements, @output, @prefix} = @options
    @output or= join ".cache", @path
    @shouldWatch = @options.watch
    util.makedirs @path
  
  
  # This method must be overridden by subclasses to specify modules it needs
  # to operate properly.
  requiredModules: -> []
  
  # This method creates a file through its parent `@package.file` method, 
  # using the given access path and this source's type. It assumes the
  # fullpath is simply the access path, prefix with this source's path and
  # this source's extension (class variable `ext`).
  createFile: (fpath) -> 
    {join} = require 'path'
    ctor = @constructor
    fullpath = join @path, fpath
    fpath = util.changeext fpath, ''
    fpath = join @prefix, fpath if @prefix?
    file = @package.file fpath, ctor.type, fullpath, @
    file.register()
    if @requirements?
      imports = @requirements[file.relpath] ? []
      imports = imports.concat @requirements.all ? []
      file.setImportedPaths imports
    
    file
  
  
  # This method returns whether or not the given filename should be
  # considered a source file.
  test: (path) ->
    ext = @constructor.ext
    if _.isArray ext
      _.any ext, (_ext) -> util.hasext path, _ext
    else
      util.hasext path, ext
  
  
  # This method yields a set of file paths that it can find on disk, under
  # this source's path. It takes two callbacks as argument : a `yield`
  # callback which is called with every single file it finds, and a 
  # `end` callback, called when the directory walking is done.
  list: (cb, end) ->
    walk = require 'walk'
    {join} = require 'path'
    filelist = []
    walker = walk.walk (rpath = join @path, ''), followLinks: true
    walker.on 'file', (root, stat, next) =>
      fpath = join root[rpath.length+1..], stat.name
      if @test fpath
        cb fpath
      next()
    
    walker.on 'end', end if end?
  
  
  # This method yields a set of *File* objects contained in this source.
  # If the cached version of this list can be found, that list is used
  # instead of resorting to walking the directory. Otherwise, the `list`
  # method above is used to produce, for every file path found, a file
  # using the `createFile` method above. Two callbacks can be given as
  # arguments: a `yield` callback which is called with every *File* 
  # object, and a `list` callback, called with the final list of all
  # of them.
  files: (cb, list) ->
    if @filelist?
      (require 'underscore').each @filelist, cb if cb?
      list @filelist if list?
    else
      @filelist = []
      each = (fpath) =>
        file = @createFile fpath
        cb file if cb?
        @filelist.push file
      @list each, => list @filelist if list?
  
  
  # This method is used to setup a 
  # [FSWatchers](http://nodejs.org/docs/latest/api/fs.html#fs.FSWatcher)
  # on this source's path,
  # to catch the event where a file is added. It calls the given
  # `reset` callback if the `@list` method above returns a file
  # that is not currently listed in the cached file list.
  watch: (reset) ->  
    return unless @shouldWatch
    filelist = null
    require('./index').watchers.incr()
    @watcher = (require 'fs').watch @path, (event) =>
      return unless @filelist?
      filelist ?= (f.relpath for f in @filelist)
      @list (fpath) ->
        fpath = util.changeext fpath, ''
        if fpath not in filelist
          info fpath, 'added'
          reset()
      
    
  
  
  # This method is used to close the FSWatcher if it as been set, and
  # decrements the global file watcher count
  unwatch: ->
    if @watcher
      @watcher.close()
      require('./index').watchers.decr()
      delete @watcher
  
  
exports.Source = Source