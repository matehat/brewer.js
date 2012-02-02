
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
