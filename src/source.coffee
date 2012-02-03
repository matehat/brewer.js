path  = require 'path'
fs    = require 'fs'
_     = require 'underscore'
util  = require './util'
{EventEmitter} = require 'events'

@Source = class Source
  @registry = {}
  @extend: (sources...) ->
    for src in sources
      for type in (src.types ? [])
        @registry[type] = src
  
  @create: (options, brewer) ->
    throw "Source type #{options.type} not known" unless (typ = @registry[options.type])?
    new typ options, brewer
  
  
  constructor: (@options) ->
    _.defaults @options, watch: false, follow: true
    {@watch, @path, @follow} = @options
  
  deps: (data) -> 
    parseHeader @constructor.header, data
  
  find: (rel) ->
    rel = util.changeExtension rel, @constructor.ext
    fullPath = path.join @path, rel
    if path.existsSync fullPath then fullPath else false
  
  compileAll: (cb) ->
    return cb() unless @compileFile?
    list = []
    @listFiles (path) =>
      list.push path
      @compileFile path, =>
        list = _.without list, path
        if list.length == 0 and cb?
          cb()
      
    
  
  listFiles: (yield) ->
    walk = require 'walker'
    filelist = []
    walker = new walk @path, followLinks: true
    walker.on 'file', (root, stat) =>
      fpath = path.join root[path.join(@path, '').length..], stat.name
      return unless @test fpath
      yield fpath
    
  


parseHeader = (regexp, data) ->
  recurse = (_data) ->
    return '' unless (match = _data.match regexp)?
    match[1] + recurse _data[match[0].length+match.index ...]
  
  if (json = recurse data).length > 0 then JSON.parse json else []

