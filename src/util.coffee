_ = require 'underscore'
fs = require 'fs'
path = require 'path'
{debug} = require './command'

@makedirs = makedirs = (fpath) ->
  fpath = path.resolve fpath
  dir = path.dirname fpath
  makedirs dir unless path.existsSync dir
  fs.mkdirSync fpath unless path.existsSync fpath

@hasext = hasext = (filename, ext) ->
  path.extname(filename) == ext

@changeext = changeext = (filename, ext) ->
  return filename if hasext filename, ext
  return "#{splitext(filename)[0]}#{ext}"

@splitext = splitext = (filename) ->
  ext = path.extname filename
  len = filename.length
  return [filename[0...len-ext.length], ext]

@newer = (file1, file2, cb) ->
  path.exists file1, (exists) ->
    return cb(null, false) unless exists
    path.exists file2, (exists) ->
      return cb(null, true) unless exists
      fs.stat file1, (err, stats) ->
        return cb err if err
        time1 = stats.mtime.getTime()
        fs.stat file2, (err, stats) ->
          return cb err if err
          time2 = stats.mtime.getTime()
          cb null, time1 > time2


@newest = (file, others..., cb) =>
  cnt = others.length
  newest = true
  fail = false
  for otherFile in others
    do (otherFile) =>
      return if fail
      @newer file, otherFile, (err, newer) =>
        return if fail
        return (fail = true) and cb err if err?
        newest &&= newer
        cb(newest) if --cnt == 0
      
    
@newerSync = (file1, file2) ->
  return false unless path.existsSync file1
  return true unless path.existsSync file2
  time1 = fs.statSync(file1).mtime.getTime()
  time2 = fs.statSync(file2).mtime.getTime()
  return time1 > time2

@newestSync = (file, others...) =>
  newest = true
  for otherFile in others
    newest &&= @newer file, otherFile
  newest
