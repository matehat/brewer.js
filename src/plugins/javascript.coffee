_ = require 'underscore'
fs = require 'fs'
path = require 'path'

{Package, Source} = require '..'
util = require '../util'
{Bundle} = require '../bundle'
{finished} = require '../command'

class JavascriptPackage extends Package
  @types = ['javascript', 'js']
  @default = 'javascript'
  
  constructor: (options, sources, vendor) ->
    super
    _.defaults options, compress: true
    {@compress, @build, @bundles} = options
    @bundles = JSON.parse fs.readFileSync @bundles if _.isString @bundles
    
    for lib in @vendor.dirs 'js'
      @registerSource Source.create {path: lib, type: 'js'}, @
  
  bundlePath: (file) -> 
    path.join @build, util.changeext file.relpath, '.js'
  
  compressedPath: (file) ->
    path.join @build, if compress is true
      util.changeext file.relpath, '.min.js'
    else
      _.template(compress) filename: file.relpath
  
  compress: (original, dest, cb) ->
    compress: (data, cb) -> 
      {parser, uglify} = require 'uglify-js'
      {gen_code, ast_squeeze, ast_mangle} = uglify
      cb null, gen_code ast_squeeze parser.parse data
    
    original.transformInto dest, compress, (err) ->
      cb err if err
      finished 'Compressed', original.fullpath
      cb()
  


class JavascriptSource extends Source
  @types = ['js', 'javascript']
  @ext = '.js'
  @header = /^\/\/\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m


Source.extend JavascriptSource
Package.extend JavascriptPackage
_.extend exports, {JavascriptSource, JavascriptPackage}