_ = require 'underscore'

@makedirs = makedirs = (path) ->
  {dirname, resolve, existsSync} = require 'path'
  {mkdirSync} = require 'fs'
  
  path = resolve path
  dir = dirname path
  makedirs dir unless existsSync dir
  mkdirSync path unless existsSync path

@hasExtension = hasext = (filename, ext) ->
  {extname} = require 'path'
  extname(filename) == ext

@changeExtension = changeext = (filename, ext) ->
  return filename if hasext filename, ext
  return "#{splitext(filename)[0]}#{ext}"

@splitExtension = splitext = (filename) ->
  ext = (require 'path').extname filename
  len = filename.length
  return [filename[0...len-ext.length], ext]

@newer = (file1, file2, cb) ->
  fs = require 'fs'
  path = require 'path'
  
  try
    path.exists file1, (exists) ->
      return cb(null, false) unless exists
      path.exists file2, (exists) ->
        return cb(null, true) unless exists
        fs.stat file1, (err, stats) ->
          throw err if err
          time1 = stats.mtime.getTime()
          fs.stat file2, (err, stats) ->
            throw err if err
            cb null, time1 > stats.mtime.getTime()
    
  catch err
    cb err

@newest = (file, others..., cb) =>
  cnt = others.length
  newest = true
  for otherFile in others
    do (otherFile) =>
      @newer file, otherFile, (err, newer) =>
        newest &&= newer
        cb(newest) if --cnt == 0
      
    
