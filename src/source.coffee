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
      for type in (src.types ? [])
        @registry[type] = src
  
  @create: (options) ->
    throw "Source type #{options.type} not known" unless (typ = @registry[options.type])?
    new typ options, package
  
  
  constructor: (@options, @package) ->
    _.defaults @options, watch: false, follow: true
    {@watch, @path, @follow} = @options
  
  createFile: (path) -> 
    ctor = @constructor
    file = new File path, path.join(@path, path), ctor.types[0], @
    @package.registerFile file
    file
  
  test: (path) -> util.hasext path, @constructor.ext
  
  files: (yield, end) ->
    if @filelist?
      _.each @filelist, yield if yield?
      end @filelist if end?
    else
      @filelist = []
      each = (path) =>
        file = @createFile path
        yield file if yield?
        @filelist.push file
      @list each, => end @filelist if end?
  
  list: (yield, end) ->
    walk = require 'walker'
    filelist = []
    walker = new walk @path, followLinks: true
    walker.on 'file', (root, stat) =>
      fpath = path.join root[path.join(@path, '').length..], stat.name
      return unless @test fpath
      yield fpath
    
    walker.on 'end', end
  
exports.Source = Source