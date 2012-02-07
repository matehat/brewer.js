util = require '../util'
fs = require 'fs'
path = require 'path'
_ = require 'underscore'
{Source} = require '..'
{Bundle} = require '../bundle'
{finished, debug} = require '../command'
{StylesheetsPackage, StylesheetsSource, StylesheetsBundle} = require './css'

@StylusBundle = class StylusBundle extends StylesheetsBundle
  stylus: (data) ->
    return @setOptions require('stylus') data
  
  importPath: (src, file) ->
    if src instanceof StylusSource
      path.join src.path, util.changeExtension file, src.constructor.ext
    else
      super src, file
  
  importPaths: ->
    for src in @package.sources when src instanceof StylusSource
      path.join src.stylus_path
  
  setOptions: (styl) ->
    styl.set 'paths', @importPaths()
    styl.set 'filename', @file
    
    opts = @package.source(@file).options
    if (mods = opts.modules)?
      mods = [mods] if _.isString mods
      for mod in mods
        module = require mod
        styl.use(module()) if _.isFunction module
    
    styl
  
  convertFile: (data, cb) ->
    @stylus(data).render (err, css) =>
      throw err if err
      cb css
  

@StylusSource = class StylusSource extends StylesheetsSource
  @types = ['stylus', 'styl']
  @ext = StylusBundle.ext = '.styl'
  @buildext = StylusBundle.buildext = '.css'
  @header = /^\/\/\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m
  
  @Bundle = StylusBundle
  
  constructor: (options, @package) ->
    _.defaults options, compileAll: false
    super options
    @css_path = @output
    @stylus_path = @path
  
  find: (rel) ->
    return fullPath if (fullPath = super(rel)) != false
    
    rel = util.changeExtension rel, @constructor.ext
    fullPath = path.join @path, rel
    if path.existsSync fullPath then fullPath else false
  
  test: (relpath) -> 
    path.extname(relpath) in @constructor.ext
  
  compileAll: (cb) ->  
    if @options.compileAll then super cb else cb()
  
  compileFile: (relpath, next) ->
    (new StylusBundle(@package, relpath)).bundle -> next()
  

Source.extend StylusSource