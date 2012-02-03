path  = require 'path'
util  = require './util'
{finished, debug} = require './command'
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
  
  sourcePaths: ->
    @sourcePath(i) for i in [0..@files.length]
  
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
    util.makedirs path.dirname (buildPath = @buildPath())
    @brewer.deps @file, (@files) =>
      util.newest buildPath, @sourcePaths()..., (newest) =>
        if newest
          finished 'Unchanged', buildPath
          cb buildPath
        else
          @stream = ''
          @readFile 0, (data) =>
            @convert data, (newdata) =>
              fs.writeFile buildPath, newdata, 'utf-8', -> 
                finished 'Packaged', buildPath
                cb buildPath
  
  compress: (cb) ->
    util.newer (cmpFile = @compressedFile), (buildPath = @buildPath())
    , (err, newer) =>
      if newer
        finished 'Unchanged', cmpFile
        return cb cmpFile
      fs.readFile buildPath, 'utf-8', (err, data) =>
        @compressFile data, (code) =>
          fs.writeFile cmpFile, code, 'utf-8', ->
            finished 'Compressed', cmpFile
            cb cmpFile
      
  convertFile: (data, cb) -> cb data
  compressFile: @::convertFile
