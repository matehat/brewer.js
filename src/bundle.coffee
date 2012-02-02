path  = require 'path'
util  = require './util'
fs    = require 'fs'

@Bundle = class Bundle
  constructor: (@brewer, @file) ->
    @basepath = path.join @brewer.build, @file
    @compressedFile = @brewer.compressedFile filename: util.changeExtension @basepath, ''
  
  buildPath: ->
    @_buildPath = util.changeExtension @basepath, (@buildext ? @ext) unless @_buildPath?
    @_buildPath
  
  sourcePath: (i) ->
    @brewer.fullPath if i < @files.length then @files[i] else @file
  
  readFile: (i, cb, mod=((a)->a)) ->
    rs = fs.readFile @sourcePath(i), {encoding: 'utf-8'}, (err, data) =>
      throw err if err
      @stream += mod(data.toString())
      @nextFile i, cb, mod
    
  
  nextFile: (i, cb, mod) ->
    if i < @files.length
      @readFile i+1, cb, mod
    else
      cb @stream
      delete @stream
  
  bundle: (cb) ->
    @brewer.deps @file, (@files) =>
      @stream = ''
      @readFile 0, cb
  

