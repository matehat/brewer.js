path  = require 'path'
fs    = require 'fs'
_     = require 'underscore'
util  = require './util'
{debug} = require './command'
{EventEmitter} = require 'events'
{File} = require './file'

class Source
  @registry = {}
  @extend: (sources...) ->
    for src in sources
      @registry[src.type] = src
      for alias in (src.aliases ? [])
        @registry[alias] = src
  
  @create: (options, package) ->
    throw "Source type #{options.type} not known" unless (typ = @registry[options.type])?
    new typ options, package
  
  
  constructor: (@options, @package) ->
    _.defaults @options, watch: false, follow: true
    {@watch, @path, @follow, @requirements} = @options
  
  createFile: (fpath) -> 
    ctor = @constructor
    fullpath = util.changeext path.join(@path, fpath), @constructor.ext
    file = @package.file fpath, ctor.type, fullpath, @
    file.register()
    file
  
  test: (path) -> util.hasext path, @constructor.ext
  
  files: (yield, end) ->
    if @filelist?
      _.each @filelist, yield if yield?
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
    filelist = []
    walker = new walk (rpath = path.join @path, ''), followLinks: true
    walker.on 'file', (root, stat) =>
      fpath = path.join root[rpath.length+1..], stat.name
      return unless @test fpath
      yield fpath
    
    walker.on 'end', end
  
exports.Source = Source