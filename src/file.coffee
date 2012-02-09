path  = require 'path'
util  = require './util'
{finished, debug} = require './command'
{EventEmitter} = require 'events'
fs    = require 'fs'
_ = require 'underscore'

class File extends EventEmitter
  constructor: (@relpath, @type, @package) ->
    @dependencies = []
    @liabilities = []
  
  attach: (fullpath, source) ->
    if @attached()
      if fullpath isnt @fullpath
        throw new Error "File already attached to #{@fullpath}"
    else
      [@fullpath, @source] = [fullpath, source]
      @emit 'attach'
  
  register: -> @package.registerFile @
  dependOn: (other, actualize) ->
    @dependencies.push [other, actualize]
  
  dependedBy: (other) ->
    @liabilities.push other
  
  actualize: (cb) ->
    i = 0
    (iter = (cb2) =>
      if i < @dependencies.length
        [dep, act] = @dependencies[i++]
        dep.actualize -> iter(cb2)
      else cb2()
    )( =>
      for [dep, act] in @dependencies
        unless dep.newest()
          act dep, @, (err) => throw new Error err if err
          break
    )
  
  
  readImportedPaths: ->
    regexp = @source.constructor.header
    recurse = (_data) ->
      return '' unless (match = _data.match regexp)?
      match[1] + recurse _data[match[0].length+match.index ...]
    
    if (json = recurse @readSync()).length > 0 then JSON.parse json else []
  
  setImportedPaths: (paths) -> 
    @_importedPaths = paths
  
  importedPaths: ->
    unless @_importedPaths?
      @_importedPaths = @readImportedPaths
    @_importedPaths
  
  imports: ->
    unless @_imports?
      @_imports = @package.file(path, @type) for path in @importedPaths()
    @_imports
  
  dependOnImports: (other, actualize) ->
    imported = []
    @pre = other
    crawl = (file) ->
      depend _file for _file in file.imports()
    
    depend = (file) =>
      if file.relpath not in imported
        if file.attached()
          crawl file
        else
          file.on 'attach', => crawl file
        
        @dependOn file, actualize
        imported.push file.relpath
    
    depend other
  
  tsortedImports: ->
    
    # ### Topological sorting algorithm
    #
    # It returns a list of files, the order of which preserves
    # the precedence specified as 'imports'.
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
    # Taken from http://en.wikipedia.org/wiki/Topological_sort#Algorithms
    
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
    
    buildDAG @
    S = [@pre]
    while S.length > 0
      n = S.shift()
      topoSortedFiles.push n
      for m in n.imports()
        edges = DAG[m.relpath]
        edges = _.without edges, n.relpath
        if edges.length is 0
          S.push m
    
    topoSortedFiles.reverse()
  
  
  newest: ->
    util.newestSync @fullpath, (other.fullpath for other in @dependencies)...
  
  valid: ->
    return true unless @dependencies.length == 0
    return false unless _.all @dependencies, (dep) -> dep.valid()
    return false unless @newest()
  
  attached: -> @fullpath?
  exists: -> @attached() and path.existsSync @fullpath
  makedirs: -> util.makedirs path.dirname @fullpath
  read: (cb) -> 
    return unless @exists()
    fs.readFile @fullpath, 'utf-8', cb
  
  readSync: -> 
    return unless @exists()
    fs.readFileSync @fullpath, 'utf-8'
  
  write: (data, cb) ->
    return unless @attached()
    @makedirs()
    fs.writeFile @fullpath, data, 'utf-8', cb
  
  writeSync: (data) ->
    return unless @attached()
    @makedirs()
    fs.writeFileSync @fullpath, data, 'utf-8'
  
  
  transformInto: (dest, morph, cb) ->
    @read (err, data) ->
      cb err if err
      morph data, (newdata) ->
        dest.write newdata, cb
  

exports.File = File