path  = require 'path'
util  = require './util'
fs    = require 'fs'

@Bundle = class Bundle
  constructor: (@brewer, @file) ->
    @basepath = path.join @brewer.build, @file
    @compressedFile = @brewer.compressedFile filename: util.changeExtension @basepath, ''
  
  buildPath: ->
    @_buildPath = util.changeExtension @basepath, (@constructor.buildext ? @constructor.ext) unless @_buildPath?
    @_buildPath
  
  sourcePath: (i) ->
    @brewer.fullPath(if i < @files.length then @files[i] else @file)
  
  stat: (cb) ->
    fs.stat @file, cb
    
  compressedStat: (cb) ->
    fs.stat @compressedFile, cb
  
  readFile: (i, cb, mod=((a)->a)) ->
    rs = fs.readFile @sourcePath(i), {encoding: 'utf-8'}, (err, data) =>
      @stream += mod(data.toString())
      @nextFile i, cb, mod
    
  
  nextFile: (i, cb, mod) ->
    if i < @files.length
      @readFile i+1, cb, mod
    else
      cb @stream
      delete @stream
  
  bundle: (cb, unchanged) ->
    util.makedirs path.dirname @buildPath()
    @brewer.deps @file, (@files) =>
      util.newest @buildPath(), @files..., (newest) =>
        if newest
          unchanged()
        else
          @stream = ''
          @readFile 0, cb
  

