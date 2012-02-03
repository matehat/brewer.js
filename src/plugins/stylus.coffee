util = require '../util'
fs = require 'fs'
path = require 'path'
{Source} = require '..'
{Bundle} = require '../bundle'
{finished} = require '../command'
{StylesheetsBrewer, StylesheetsSource, StylesheetsBundle} = require './css'

@StylusBundle = class StylusBundle extends StylesheetsBundle
  stylus: (data) ->
    return @setOptions require('stylus') data
  
  setOptions: (styl) ->
    styl.set 'paths', (src.less_path ? src.css_path) for src in @brewer.sources
    styl.set 'filename', @file
  
  convertFile: (data, cb) ->
    @stylus(data).render (err, css) =>
      throw err if err
      cb css
  

@StylusSource = class StylusSource extends StylesheetsSource
  @types = ['stylus', 'styl']
  @ext = StylusBundle.ext = ['.stylus', '.styl']
  @buildext = StylusBundle.buildext = '.css'
  @header = /^\/\/\s*(?:import|require)\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m
  
  @Bundle = StylusBundle
  
  constructor: (options, @brewer) ->
    _.defaults options, compileAll: false
    super options
    @css_path = @path
  
  find: (rel) ->
    return fullPath if (fullPath = super(rel)) != false
    
    rel = util.changeExtension rel, @constructor.ext
    fullPath = path.join @path, rel
    if path.existsSync fullPath then fullPath else false
    
  test: (relpath) -> 
    path.extname(relpath) == '.less'
  
  compileAll: (cb) ->  
    if @options.compileAll then super cb else cb()
  
  compileFile: (relpath, next) ->
    (new StylusBundle(@brewer, relpath)).bundle -> next()
  

Source.extend StylusSource