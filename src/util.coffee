# This modules exports a few functions used throughout 
# **brewer.js**, and not specific to certain components, such
# as calculating checksums, manipulating extensions and 
# comparing mtime's.

_ = require 'underscore'
fs = require 'fs'
path = require 'path'
{debug} = require './command'

# These two functions calculate the MD5 checksum of a
# file or stream. The first one by synchronously reading
# the whole content of a file (use sparingly), and the
# second sets up a listener on a readable stream and
# updates the hash as data comes in.
@checksumSync = (path) ->
  md5 = (require 'crypto').createHash 'md5'
  md5.update fs.readFileSync path
  md5.digest 'hex'

@checksumStream = (readStream, cb) ->
  md5 = (require 'crypto').createHash 'md5'
  readStream.on 'data', (data) -> md5.update data
  readStream.on 'end', -> cb md5.digest 'hex'


# This function is used to recursively make all directories
# leading to a path, by starting on the leaf node and climbing
# until it reaches an existing directory. This is done to
# avoid greediness.
@makedirs = makedirs = (fpath) ->
  fpath = path.resolve fpath
  dir = path.dirname fpath
  makedirs dir unless path.existsSync dir
  fs.mkdirSync fpath unless path.existsSync fpath


# This function returns whether the given filename has the given
# extension.
@hasext = hasext = (filename, ext) ->
  path.extname(filename) == ext

# This function returns a new version of the given filename, by
# ensuring its extension is the given one.
@changeext = changeext = (filename, ext) ->
  return filename if hasext filename, ext
  return "#{splitext(filename)[0]}#{ext}"

# This function returns a array of two strings, given a filename: 
# a basename and an extension.
@splitext = splitext = (filename) ->
  ext = path.extname filename
  len = filename.length
  return [filename[0...len-ext.length], ext]

# This asynchronous function takes 2 files and a callback as 
# arguments, and returns whether the first file can be considered
# newer than the second. It first checks whether the first file 
# exists, returning false if not. Then it does the same with the
# second file, returning true if not. Then it checks stat.mtime
# for both of the files and compares them. The callback style
# follows Node.js convention of (error, value).
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

# This function is a synchronous equivalent of the above function.
@newerSync = (file1, file2) ->
  return false unless path.existsSync file1
  return true unless path.existsSync file2
  time1 = fs.statSync(file1).mtime.getTime()
  time2 = fs.statSync(file2).mtime.getTime()
  return time1 > time2


# This asynchronous function takes a series of file and a callback
# and returns whether the first of them can be considered the 
# newest. It loops through all of them calling the `newer()` to
# compare the first file with each, accumulating a boolean value
# that gets returned when all files have been evaluated. 
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
        cb(null, newest) if --cnt == 0
      
      
    
# This is a synchronous version of the above function.
@newestSync = (file, others...) =>
  newest = true
  for otherFile in others
    newest &&= @newer file, otherFile
  newest


# This function only tries to import the given module, and if it fails it returns
# `false` if error corresponds to a missing module error.
@testModule = (mod) ->
  try
    require(mod)
  catch err
    err.message.indexOf('Cannot find module') is -1
