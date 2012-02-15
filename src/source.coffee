# ## The Source class
# 
# This module exports the *Source* class. A source object is bound to a path
# on disk and a file type (*javascript*, *css*, *coffeescript*, *less*, etc).
# It provides a set of source files, those that are found by recursively
# walking the referenced directory, and testing all files it can find.
# It is also bound to a parent package, to which its files are registered.
#
# The *Source* class is subclassed to implement compilation behavior, such as
# for coffee-script. In these cases, for every single *source* file, a 
# *compiled* file is also created, of which the type must correspond to
# that of the parent package.

# Common utilities are loaded up.
util  = require './util'
{debug, info} = require './command'

class Source
  # Much like for *[Package](package.html#section-3)*, a registry of subclasses
  # must be maintained to associate types (*coffeescript*, *less*, *javascript*, 
  # etc) to particular subclasses of *Source*.
  @registry = {}
  @extend: (sources...) ->
    for src in sources
      @registry[src.type] = src
      for alias in (src.aliases ? [])
        @registry[alias] = src
  
  @create: (options, package) ->
    throw "Source type #{options.type} not known" unless (typ = @registry[options.type])?
    new typ options, package
  
  
  # A *Source* is initialized with an option object, which is the result of 
  # evaluating a *source directive* in a [Brewfile](brewfile.html#section-7).
  # After setting instance variables, the path to the source directory is
  # created recursively.
  constructor: (@options, @package) ->
    (require 'underscore').defaults @options, {
      watch: true 
      output: './_cache'
    }
    {@path, @requirements} = @options
    @shouldWatch = @options.watch
    util.makedirs @path
  
  # 
  createFile: (fpath) -> 
    ctor = @constructor
    fullpath = util.changeext (require 'path').join(@path, fpath), ctor.ext
    file = @package.file fpath, ctor.type
    file.attach fullpath, @
    file.register()
    file
  
  test: (path) ->
    util.hasext path, @constructor.ext
  
  files: (yield, end) ->
    if @filelist?
      (require 'underscore').each @filelist, yield if yield?
      end @filelist if end?
    else
      @filelist = []
      each = (fpath) =>
        file = @createFile util.changeext fpath, ''
        if (imports = @requirements?[file.relpath])?
          file.setImportedPaths imports
        
        yield file if yield?
        @filelist.push file
      @list each, => end @filelist if end?
  
  list: (yield, end) ->
    walk = require 'walker'
    {join} = require 'path'
    filelist = []
    walker = new walk (rpath = join @path, ''), followLinks: true
    walker.on 'file', (root, stat) =>
      fpath = join root[rpath.length+1..], stat.name
      return unless @test fpath
      yield fpath
    
    walker.on 'end', end if end?
  
  watch: (reset) ->  
    return unless @shouldWatch and @filelist?
    filelist = (f.relpath for f in @filelist)
    @watcher = (require 'fs').watch @path, (event) => 
      @list (fpath) ->
        fpath = util.changeext fpath, ''
        if fpath not in filelist
          info fpath, 'added'
          reset()
      
    
  
  unwatch: ->
    @watcher?.close()
  
  
exports.Source = Source