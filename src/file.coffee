path  = require 'path'
util  = require './util'
{finished, debug} = require './command'
{EventEmitter} = require 'events'
{debug} = require './command'
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
    other.dependedBy @
  
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
      if @dependencies.length > 0
        newest = true
        for [dep, act] in @dependencies
          unless @newer dep
            act dep, @, (err) =>
              throw new Error err if err
              cb()
            newest = false
            break
        cb() if newest
      else cb()
    )
  
  
  readImportedPaths: ->
    if @source?
      regexp = @source.constructor.header
      recurse = (_data) ->
        return '' unless (match = _data.match regexp)?
        match[1] + recurse _data[match[0].length+match.index ...]
    
      if (json = recurse @readSync()).length > 0 then JSON.parse json else []
    else
      []
  
  setImportedPaths: (paths) -> 
    @_importedPaths = paths
    @_imports = null
  
  importedPaths: ->
    unless @_importedPaths?
      @_importedPaths = @readImportedPaths()
    @_importedPaths
  
  imports: ->
    unless @_imports?
      @_imports = (@package.file(path, @type) for path in @importedPaths())
    @_imports
  
  dependOnImports: (other, actualize) ->
    imported = []
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
    S = [@]
    while S.length > 0
      n = S.shift()
      topoSortedFiles.push n
      for m in n.imports()
        DAG[m.relpath] = _.without DAG[m.relpath], n.relpath
        if DAG[m.relpath].length is 0
          S.push m
    
    topoSortedFiles.reverse()
  
  
  newer: (other) ->
    util.newerSync @fullpath, other.fullpath
  
  attached: -> @fullpath?
  exists: -> @attached() and path.existsSync @fullpath
  makedirs: -> util.makedirs path.dirname @fullpath
  read: (cb) ->
    return unless @exists()
    fs.readFile @fullpath, 'utf-8', (err, data) ->
      cb(err, data)
  
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
  
  
  project: (dest, morph, cb) ->  
    @read (err, data) ->
      cb err if err
      morph data, (error, newdata) ->
        dest.write newdata, cb
  

exports.File = File