# ## The *File* class
#
# This module exports the *File* class, which wraps all
# information about a file: 
#
# * Its access path and full path
# * Its type (*javascript, css, less, etc.*)
# * Its associated *[Source](source.html)* and *[Package](package.html)* objects
#
# It also holds all logic related to maintaining and interacting 
# with the files on disk.

# First import core modules, as well as third-party modules and
# cli utilities.

path  = require 'path'
util  = require './util'
fs    = require 'fs'
{EventEmitter} = require 'events'

_ = require 'underscore'
cli = require './command'

#### Initialization
#
# A *File* object is initialized with an access path, a type
# and a *Package* object. At this point, it cannot interact with
# the filesystem, because it does not know what the fullpath is
# (it might not even exist!).

class File extends EventEmitter
  constructor: (@relpath, @type, @package) ->
    @dependencies = []
    @liabilities = []
  
  
  # This method associates a file with a fullpath and
  # a *Source* object. At this point, it can interact with the
  # filesystem. It is used first to detect if a file is attached
  # twice (which shouldn't happen), and to trigger listeners, which
  # might have been waiting for the file to be attached. This happens
  # when a file references another one, that does not exist yet.
  attach: (fullpath, source) ->
    if @attached()
      if fullpath isnt @fullpath
        cli.warning 'with', fullpath, ':', """
        The access path "#{@relpath}" is already associated with "#{@fullpath}",
        but a new file "#{fullpath}" is trying to get associated with the
        same accesspath. Delete or rename one or the two to solve the
        problem. For now, we're keeping "#{@fullpath}".
        """
    else
      [@fullpath, @source] = [fullpath, source]
      @emit 'attach'
  
  
  # This method tells the associated *Package* object to
  # register this file, a mechanism required so the package can 
  # adequately manage all its contained files.
  register: ->
    @package.emit 'newfile', this
  
  
  #### Output methods
  
  # This method is used to actualize a file relative to its 
  # dependencies. It takes a continuation callback as sole argument.
  actualize: (cb) ->
    # It first loops through all dependencies, telling each to actualize in 
    # turn. This is done asynchronously, so we wait for each one to finish before 
    # continuing to the next. When all are actualized, we call the `end()` method, 
    # below. It should be noticed that this is a 
    # *[depth-first](http://en.wikipedia.org/wiki/Depth-first_search)*-type 
    # algorithm.
    
    i = 0
    iter = () =>
      if i < @dependencies.length
        [dep, act] = @dependencies[i++]
        dep.actualize iter
      else end()
    
    # When all dependencies are actualized, we, again, loop through all of them
    # comparing its modification time with this file. In case a given dependency is 
    # newer, we trigger the associated actualization function, given earlier 
    # through `dependOn(..)`. At the end of the loop, if the file is still considered
    # newest, we trigger the continuation callback, otherwise it will be called at
    # the end of the actualization.
    end = =>
      if @dependencies.length > 0
        newest = true
        for [dep, act] in @dependencies
          unless @newerThan dep
            act dep, this, (err) =>
              throw new Error err if err
              cb()
            
            newest = false
            break
        cb() if newest
      else cb()
    
    iter()
  
  
  # This method is used to apply a transformation (*morph*) to this file 
  # and output the result in another (*dest*). It also takes a 
  # continuation callback as its last argument.
  project: (dest, morph, cb) ->  
    @read (err, data) ->
      cb err if err
      morph data, (error, newdata) ->
        dest.write newdata, cb
      
    
  
  
  # This method is used to watch the file on the filesystem, which 
  # should only happend if the file is attached and has liabilities. 
  # It takes a reset function as sole argument, which is called when 
  # a change happens.
  watch: (reset) ->
    if @attached() and @liabilities.length > 0
      
      # If the file has an associated source that should not be 
      # watched for changes, then the file should not be watched.
      return unless !@source? or @source.shouldWatch
      
      # The file is stamped, which means that its md5 checksum is
      # calculated and cached. Then the FSWatcher is setup to watch
      # the file. When a 'rename' event happens, the file has either
      # been removed or moved -- in both cases, this is sufficient
      # to trigger a reset. If the event is 'change' we make sure
      # the file has really change by checking the stamp, then trigger
      # reset in case it really did change.
      @stamp()
      require('./index').watchers.incr()
      
      @watcher = fs.watch @fullpath, (event) =>
        if event is 'rename'
          cli.info "#{@fullpath} removed"
          for file in @liabilities
            file.destroy()
          
          _.defer reset
        else if @changed()
          cli.info "#{@fullpath} changed"
          reset()
        else
          @unwatch()
          @watch reset
      
      @watcher.on 'error', (err) =>
        cli.debug 'error', err
        reset()
      
  
  
  # This method shuts the watcher if it exists, so no more fs events
  # are catched. It also decrements the global count of file watchers.
  unwatch: ->
    if @watcher?
      @watcher.close()
      require('./index').watchers.decr()
      delete @watcher
  
  
  # The stamping method used to cache a md5 checksum of the file on
  # disk.
  stamp: ->
    @checksum = util.checksumSync(@fullpath)
  
  # This method returns whether the file on disk should be considered
  # changed from the last `stamp()` method call. It returns false if
  # no checksum is cached.
  changed: ->
    return true unless (
      @exists() and @checksum? and
      @checksum is util.checksumSync(@fullpath)
    )
  
  
  #### Managing *dependencies*
  
  # This method indicates to the file that it depends on another file.
  # It takes a file and an actualization function, called when the 
  # depending file is expired relative to the depended one. Both are 
  # pushed to a list of dependencies. It also indicates to the other 
  # file that it is depended upon.
  dependOn: (other, actualize) ->
    @dependencies.push [other, actualize]
    other.dependedBy this
  
  
  # This method indicates to the file that it is depended by another 
  # file. This barely adds the file passed as argument to a local list 
  # of liabilities.
  dependedBy: (other) ->
    @liabilities.push other
  
  
  #### Managing *imports*
  #
  # Imports specify what file should precede the current file, should
  # this file be used in a bundle.
  
  # This method reads the file and parses it to find `import`
  # directives. It can only do this if it is attached to a *Source*
  # object, since this source specifies the regular expression used
  # to find those directives.
  readImportedPaths: ->
    return [] unless @source? and (regexp = @source.constructor.header)?
    
    # Every chunk that matches the regexp pattern is concatenated
    # and the result is assumed to be a JSON array of strings,
    # and returned.
    #
    # **TODO** : Find something better than this.
    
    recurse = (_data) ->
      return '' unless (match = _data.match regexp)?
      match[1] + recurse _data[match[0].length+match.index ...]
    
    paths = if (json = recurse (@readSync() || '')).length > 0
      _.map JSON.parse(json), util.normalizePath
    else []
    paths = (util.changeext(p, '') for p in paths)
  
  
  # This method is used to specify what the imports of this file
  # should be. It is used, for instance, to carry over imports that
  # are specified in a .coffee file, to its output .js file, which
  # would be used in bundles.
  setImportedPaths: (paths) -> 
    @_importedPaths = paths
    @_imports = null
  
  
  # This returns the list of current imports, as a list of relative
  # (access) path. It first looks for a cached version, reading it
  # from the file if not found.
  importedPaths: ->
    unless @_importedPaths?
      @_importedPaths = @readImportedPaths()
    @_importedPaths
  
  
  # This returns a list of imports, as a list of *File* objects. It
  # first looks for a cached version, making it if not found. It uses
  # the associated *Package* object to find those *File* objects, so
  # if those files were not initialized, they are still available.
  imports: ->
    unless @_imports?
      @_imports = (@package.file(fpath, @type) for fpath in @importedPaths())
    @_imports
  
  
  # This method is used to mark the graph of *imports* (starting at `other`)
  # as *dependencies* on this file. This is used in bundles specifically,
  # so that changes in any of those imports triggers invalidation of the
  # bundle.
  dependOnImports: (other, actualize) ->
    imported = []
    
    # The *visiting* function. It first checks whether a file has already 
    # been visited, returning if it has. Then it either crawl the file now,
    # if it is already attached, or as soon as the file is attached. Then,
    # it marks the visited file as a dependency and pushes it to the list
    # of visited files.
    depend = (file) =>                  
      if file.relpath not in imported
        if file.attached()
          crawl file
        else
          file.on 'attach', => crawl file

        @dependOn file, actualize
        imported.push file.relpath
    
    # The *crawling* function. It barely calls the visiting function on all
    # imports of the given file.
    crawl = (file) ->
      depend _file for _file in file.imports()
    
    # The method starts with the provided file.
    depend other
  
  
  ##### Topological sorting algorithm
  # 
  # This method returns a list of imported files, the order of which 
  # preserves the precedence specified as 'imports'.
  # 
  # This is used to get one of the solution to
  # topologically sorting a directed acyclic graph.
  # It is garanteed to find _a_ solution, given the graph
  # is really acyclic. Here, nodes are files and edges are
  # imports expressed within it. This is used to bundle files
  # in an order that will meet precedence requirements. If cycles
  # are present, the method will silently fail, yielding a 
  # non-ordered list.
  # 
  # *Taken from [this page on Wikipedia](http://en.wikipedia.org/wiki/Topological_sort#Algorithms)*
  tsortedImports: ->
    topoSortedFiles = []
    DAG = {}
    visited = []
    buildDAG = (file) ->
      return if file.relpath in visited
      for n in file.imports()
        edges = DAG[n.relpath] ?= []
        edges.push file.relpath
        buildDAG n
      visited.push file.relpath
     
    buildDAG this
    S = [this]
    while S.length > 0
      n = S.shift()
      topoSortedFiles.push n
      for m in _.clone(n.imports()).reverse()
        DAG[m.relpath] = _.without DAG[m.relpath], n.relpath
        if DAG[m.relpath].length is 0
          S.push m
    
    # We need it reversed.
    topoSortedFiles.reverse()
  
  
  #### Interacting with the *file system*
  
  # This method returns whether or not the current file is newer
  # than the provided one.
  newerThan: (other) ->
    util.newerSync @fullpath, other.fullpath
  
  
  # This method returns whether or not the current file is attached,
  # which barely means, if it has a fullpath.
  attached: -> @fullpath?
  
  # This method returns whether or not the current file exists in
  # the file system.
  exists: -> @attached() and fs.existsSync @fullpath
  
  # This method is used to make sure all directories leading to the
  # full path exist.
  makedirs: -> util.makedirs path.dirname @fullpath
  
  # These methods are used to read the content of the current file.
  read: (cb) ->
    return unless @exists()
    fs.readFile @fullpath, 'utf-8', (err, data) -> cb(err, data)
  
  readSync: ->
    return unless @exists()
    fs.readFileSync @fullpath, 'utf-8'
  
  readStream: ->
    return unless @exists()
    fs.createReadStream @fullpath, {encoding: 'utf-8'}
  
  
  # These methods are used to write content to the current file.
  write: (data, cb) ->
    return unless @attached()
    @makedirs()
    fs.writeFile @fullpath, data, 'utf-8', cb
  
  writeSync: (data) ->
    return unless @attached()
    @makedirs()
    fs.writeFileSync @fullpath, data, 'utf-8'
  
  writeStream: ->
    return unless @attached()
    @makedirs()
    fs.createWriteStream @fullpath, {encoding: 'utf-8'}
  
  
  # This method is used to delete the current file.
  unlinkSync: ->
    return unless @exists()
    fs.unlinkSync @fullpath
  

  # This method is used to delete the current file, as well
  # as all files that depend on it.
  destroy: ->
    for file in @liabilities
      file.destroy()
    
    @unlinkSync()
  

exports.File = File