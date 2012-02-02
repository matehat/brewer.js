path  = require 'path'
util  = require './util'
fs    = require 'fs'

@Bundle = class Bundle
  constructor: (@brewer, @file) ->
    @basepath = path.join @brewer.build, @file
    @compressed = @brewer.compressed_name filename: util.changeExtension @basepath, ''
  
  filepath: ->
    @_filepath = util.changeExtension @basepath, @ext unless @_filepath?
    @_filepath
  
  readFile: (i, cb, mod=((a)->a)) ->
    file = if i < @files.length then @files[i] else @file
    rs = fs.readFile path.resolve(@brewer.compressible(file)), {encoding: 'utf-8'}, (err, data) =>
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
  

